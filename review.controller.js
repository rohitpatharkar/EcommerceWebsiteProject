const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { 
    product: req.params.productId,
    isActive: true 
  };

  if (req.query.rating) {
    filter.rating = parseInt(req.query.rating);
  }

  if (req.query.verified === 'true') {
    filter.verifiedPurchase = true;
  }

  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName avatar')
    .populate('order', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments(filter);

  // Get rating distribution
  const ratingStats = await Review.aggregate([
    { $match: { product: req.params.productId, isActive: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingStats.forEach(stat => {
    distribution[stat._id] = stat.count;
  });

  res.json({
    success: true,
    count: reviews.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    ratingDistribution: distribution,
    data: reviews
  });
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'firstName lastName avatar')
    .populate('product', 'name slug images');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  res.json({
    success: true,
    data: review
  });
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment, title, images } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: productId,
    user: req.user.id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product'
    });
  }

  // Check if user purchased the product (optional verification)
  let verifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      status: 'delivered',
      'items.product': productId
    });
    verifiedPurchase = !!order;
  }

  // Create review
  const review = await Review.create({
    product: productId,
    user: req.user.id,
    order: orderId,
    rating,
    comment,
    title,
    images: images || [],
    verifiedPurchase
  });

  // Update product rating
  await product.updateRating(rating);

  // Populate and return
  const populatedReview = await Review.findById(review._id)
    .populate('user', 'firstName lastName avatar');

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: populatedReview
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res) => {
  const { rating, comment, title, images } = req.body;

  const review = await Review.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or you are not authorized to update it'
    });
  }

  // Update fields
  if (rating) review.rating = rating;
  if (comment) review.comment = comment;
  if (title !== undefined) review.title = title;
  if (images) review.images = images;

  await review.save();

  // Recalculate product rating if rating changed
  if (rating && rating !== review.rating) {
    const product = await Product.findById(review.product);
    
    // Get all reviews for this product
    const reviews = await Review.find({ product: review.product, isActive: true });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    
    product.rating.average = totalRating / reviews.length;
    product.rating.count = reviews.length;
    await product.save();
  }

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'firstName lastName avatar');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: populatedReview
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found or you are not authorized to delete it'
    });
  }

  // Soft delete
  review.isActive = false;
  await review.save();

  // Recalculate product rating
  const product = await Product.findById(review.product);
  const reviews = await Review.find({ product: review.product, isActive: true });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating.average = totalRating / reviews.length;
    product.rating.count = reviews.length;
  } else {
    product.rating.average = 0;
    product.rating.count = 0;
  }
  
  product.reviewsCount = reviews.length;
  await product.save();

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.markHelpful(req.user.id);

  res.json({
    success: true,
    message: 'Review marked as helpful',
    data: { helpfulCount: review.helpful.count }
  });
});

// @desc    Unmark review as helpful
// @route   PUT /api/reviews/:id/unhelpful
// @access  Private
exports.unmarkHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.unmarkHelpful(req.user.id);

  res.json({
    success: true,
    message: 'Review unmarked as helpful',
    data: { helpfulCount: review.helpful.count }
  });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ user: req.user.id })
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ user: req.user.id });

  res.json({
    success: true,
    count: reviews.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: reviews
  });
});

// @desc    Add admin response to review
// @route   PUT /api/reviews/:id/admin-response
// @access  Private/Admin
exports.addAdminResponse = asyncHandler(async (req, res) => {
  const { comment } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  await review.addAdminResponse(comment, req.user.id);

  res.json({
    success: true,
    message: 'Response added successfully',
    data: review
  });
});

// @desc    Get all reviews (admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
exports.getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  if (req.query.productId) {
    filter.product = req.query.productId;
  }

  if (req.query.rating) {
    filter.rating = parseInt(req.query.rating);
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  const reviews = await Review.find(filter)
    .populate('user', 'firstName lastName email')
    .populate('product', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments(filter);

  res.json({
    success: true,
    count: reviews.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: reviews
  });
});

// @desc    Toggle review status (admin)
// @route   PUT /api/reviews/admin/:id/toggle
// @access  Private/Admin
exports.toggleReviewStatus = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  review.isActive = !review.isActive;
  await review.save();

  // Recalculate product rating
  const product = await Product.findById(review.product);
  const reviews = await Review.find({ product: review.product, isActive: true });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating.average = totalRating / reviews.length;
    product.rating.count = reviews.length;
  } else {
    product.rating.average = 0;
    product.rating.count = 0;
  }
  
  product.reviewsCount = reviews.length;
  await product.save();

  res.json({
    success: true,
    message: `Review ${review.isActive ? 'activated' : 'deactivated'} successfully`,
    data: review
  });
});
