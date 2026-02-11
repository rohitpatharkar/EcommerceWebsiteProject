const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { isActive: true };

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Subcategory filter
  if (req.query.subcategory) {
    filter.subcategory = req.query.subcategory;
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.minRating) {
    filter['rating.average'] = { $gte: parseFloat(req.query.minRating) };
  }

  // Brand filter
  if (req.query.brand) {
    filter.brand = req.query.brand;
  }

  // Tags filter
  if (req.query.tags) {
    filter.tags = { $in: req.query.tags.split(',') };
  }

  // Featured, New Arrival, Bestseller filters
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.newArrival === 'true') filter.isNewArrival = true;
  if (req.query.bestseller === 'true') filter.isBestseller = true;

  // Search
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // In stock filter
  if (req.query.inStock === 'true') {
    filter.totalQuantity = { $gt: 0 };
  }

  // Build sort
  let sort = {};
  if (req.query.sort) {
    const sortField = req.query.sort;
    if (sortField === 'price_asc') sort = { price: 1 };
    else if (sortField === 'price_desc') sort = { price: -1 };
    else if (sortField === 'rating') sort = { 'rating.average': -1 };
    else if (sortField === 'newest') sort = { createdAt: -1 };
    else if (sortField === 'bestselling') sort = { salesCount: -1 };
    else if (sortField === 'name_asc') sort = { name: 1 };
    else if (sortField === 'name_desc') sort = { name: -1 };
  } else {
    sort = { createdAt: -1 };
  }

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Product.countDocuments(filter);

  // Get unique brands for filters
  const brands = await Product.distinct('brand', { isActive: true });

  res.json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    brands,
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    $or: [
      { _id: req.params.id },
      { slug: req.params.id }
    ],
    isActive: true
  })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Increment view count
  product.viewCount += 1;
  await product.save();

  res.json({
    success: true,
    data: product
  });
});

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const relatedProducts = await Product.find({
    $and: [
      { _id: { $ne: product._id } },
      { isActive: true },
      {
        $or: [
          { category: product.category },
          { tags: { $in: product.tags } },
          { brand: product.brand }
        ]
      }
    ]
  })
    .limit(8)
    .select('name price images slug rating');

  res.json({
    success: true,
    count: relatedProducts.length,
    data: relatedProducts
  });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Soft delete
  product.isActive = false;
  await product.save();

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = asyncHandler(async (req, res) => {
  const { sku, quantity } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const inventoryItem = product.inventory.find(item => item.sku === sku);
  
  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  inventoryItem.quantity = quantity;
  product.totalQuantity = product.inventory.reduce((sum, item) => sum + item.quantity, 0);
  
  await product.save();

  res.json({
    success: true,
    message: 'Stock updated successfully',
    data: {
      sku,
      quantity: inventoryItem.quantity,
      totalQuantity: product.totalQuantity
    }
  });
});

// @desc    Get product filters
// @route   GET /api/products/filters
// @access  Public
exports.getFilters = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).select('name slug');
  const brands = await Product.distinct('brand', { isActive: true });
  
  const priceRange = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      categories,
      brands: brands.filter(Boolean),
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 }
    }
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;

  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .limit(limit)
    .select('name price images slug rating comparePrice');

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;

  const products = await Product.find({ isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name price images slug rating comparePrice createdAt');

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get bestsellers
// @route   GET /api/products/bestsellers
// @access  Public
exports.getBestsellers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;

  const products = await Product.find({ isActive: true, isBestseller: true })
    .populate('category', 'name slug')
    .sort({ salesCount: -1 })
    .limit(limit)
    .select('name price images slug rating salesCount');

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});
