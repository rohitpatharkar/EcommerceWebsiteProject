const { body, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// User registration validation
exports.validateRegister = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-()]+$/).withMessage('Please enter a valid phone number'),
  exports.handleValidationErrors
];

// User login validation
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  exports.handleValidationErrors
];

// Forgot password validation
exports.validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  exports.handleValidationErrors
];

// Reset password validation
exports.validateResetPassword = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  exports.handleValidationErrors
];

// Update profile validation
exports.validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-()]+$/).withMessage('Please enter a valid phone number'),
  exports.handleValidationErrors
];

// Address validation
exports.validateAddress = [
  body('street')
    .trim()
    .notEmpty().withMessage('Street address is required'),
  body('city')
    .trim()
    .notEmpty().withMessage('City is required'),
  body('state')
    .trim()
    .notEmpty().withMessage('State is required'),
  body('zipCode')
    .trim()
    .notEmpty().withMessage('ZIP code is required'),
  body('country')
    .optional()
    .trim(),
  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean'),
  exports.handleValidationErrors
];

// Product validation
exports.validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Name cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  body('comparePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Compare price must be a positive number'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Brand cannot exceed 100 characters'),
  exports.handleValidationErrors
];

// Category validation
exports.validateCategory = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('parent')
    .optional()
    .isMongoId().withMessage('Invalid parent category ID'),
  exports.handleValidationErrors
];

// Review validation
exports.validateReview = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  exports.handleValidationErrors
];

// Coupon validation
exports.validateCoupon = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required')
    .isLength({ max: 20 }).withMessage('Code cannot exceed 20 characters'),
  body('discountType')
    .notEmpty().withMessage('Discount type is required')
    .isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue')
    .notEmpty().withMessage('Discount value is required')
    .isFloat({ min: 0 }).withMessage('Discount value must be positive'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('minimumPurchase')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum purchase must be positive'),
  exports.handleValidationErrors
];

// Cart item validation
exports.validateCartItem = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  body('sku')
    .notEmpty().withMessage('SKU is required'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  exports.handleValidationErrors
];

// Order validation
exports.validateOrder = [
  body('shippingAddress')
    .notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.firstName')
    .notEmpty().withMessage('First name is required'),
  body('shippingAddress.lastName')
    .notEmpty().withMessage('Last name is required'),
  body('shippingAddress.street')
    .notEmpty().withMessage('Street is required'),
  body('shippingAddress.city')
    .notEmpty().withMessage('City is required'),
  body('shippingAddress.state')
    .notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode')
    .notEmpty().withMessage('ZIP code is required'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['card', 'paypal', 'cod', 'bank_transfer']).withMessage('Invalid payment method'),
  exports.handleValidationErrors
];

// Update order status validation
exports.validateOrderStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'])
    .withMessage('Invalid status'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  exports.handleValidationErrors
];
