const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Get all active coupons
// @route   GET /api/coupons
// @access  Public
exports.getCoupons = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  
  const coupons = await Coupon.find({
    isActive: true,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate }
  }).select('code description discountType discountValue minimumPurchase maximumDiscount endDate');

  res.json({
    success: true,
    count: coupons.length,
    data: coupons
  });
});

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal, productIds } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Invalid coupon code'
    });
  }

  // Validate coupon
  const validation = coupon.isValid();
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.reason
    });
  }

  // Check user usage
  const userCheck = coupon.canUserUse(req.user.id);
  if (!userCheck.canUse) {
    return res.status(400).json({
      success: false,
      message: userCheck.reason
    });
  }

  // Calculate discount
  const result = coupon.calculateDiscount(subtotal, productIds);

  if (!result.applicable) {
    return res.status(400).json({
      success: false,
      message: result.reason
    });
  }

  res.json({
    success: true,
    message: 'Coupon is valid',
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: result.discount,
      finalTotal: result.finalTotal
    }
  });
});

// @desc    Get all coupons (admin)
// @route   GET /api/coupons/admin/all
// @access  Private/Admin
exports.getAllCoupons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  if (req.query.discountType) {
    filter.discountType = req.query.discountType;
  }

  const coupons = await Coupon.find(filter)
    .populate('createdBy', 'firstName lastName')
    .populate('applicableProducts', 'name')
    .populate('applicableCategories', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Coupon.countDocuments(filter);

  res.json({
    success: true,
    count: coupons.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: coupons
  });
});

// @desc    Get single coupon (admin)
// @route   GET /api/coupons/admin/:id
// @access  Private/Admin
exports.getCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate('createdBy', 'firstName lastName')
    .populate('applicableProducts', 'name slug')
    .populate('applicableCategories', 'name slug');

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }

  res.json({
    success: true,
    data: coupon
  });
});

// @desc    Create coupon (admin)
// @route   POST /api/coupons/admin
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minimumPurchase,
    maximumDiscount,
    usageLimit,
    applicableProducts,
    applicableCategories,
    excludeProducts,
    startDate,
    endDate,
    applyTo
  } = req.body;

  // Check if code already exists
  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code already exists'
    });
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minimumPurchase,
    maximumDiscount,
    usageLimit,
    applicableProducts,
    applicableCategories,
    excludeProducts,
    startDate,
    endDate,
    applyTo,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: coupon
  });
});

// @desc    Update coupon (admin)
// @route   PUT /api/coupons/admin/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }

  res.json({
    success: true,
    message: 'Coupon updated successfully',
    data: coupon
  });
});

// @desc    Delete coupon (admin)
// @route   DELETE /api/coupons/admin/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }

  // Soft delete - deactivate
  coupon.isActive = false;
  await coupon.save();

  res.json({
    success: true,
    message: 'Coupon deactivated successfully'
  });
});

// @desc    Get coupon statistics (admin)
// @route   GET /api/coupons/admin/:id/stats
// @access  Private/Admin
exports.getCouponStats = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Coupon not found'
    });
  }

  const stats = coupon.getStats();

  res.json({
    success: true,
    data: stats
  });
});
