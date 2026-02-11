const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Code cannot exceed 20 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase cannot be negative']
  },
  maximumDiscount: {
    type: Number,
    default: null,
    min: [0, 'Maximum discount cannot be negative']
  },
  usageLimit: {
    total: {
      type: Number,
      default: null,
      min: [0, 'Usage limit cannot be negative']
    },
    perUser: {
      type: Number,
      default: null,
      min: [0, 'Per user limit cannot be negative']
    }
  },
  usageCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    count: { type: Number, default: 1 },
    lastUsed: { type: Date, default: Date.now }
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applyTo: {
    type: String,
    enum: ['all', 'products', 'categories'],
    default: 'all'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Update timestamp
couponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (now < this.startDate) return { valid: false, reason: 'Coupon not yet active' };
  if (now > this.endDate) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit.total && this.usageCount >= this.usageLimit.total) {
    return { valid: false, reason: 'Usage limit reached' };
  }
  
  return { valid: true };
};

// Check if user can use coupon
couponSchema.methods.canUserUse = function(userId) {
  const userUsage = this.usedBy.find(u => u.user.toString() === userId.toString());
  
  if (this.usageLimit.perUser) {
    if (userUsage && userUsage.count >= this.usageLimit.perUser) {
      return { canUse: false, reason: 'Per-user limit reached' };
    }
  }
  
  return { canUse: true };
};

// Apply coupon to calculate discount
couponSchema.methods.calculateDiscount = function(subtotal, productIds = [], categoryIds = []) {
  // Check applicability
  if (this.applyTo === 'products' && this.applicableProducts.length > 0) {
    const hasApplicableProduct = productIds.some(id => 
      this.applicableProducts.some(apId => apId.toString() === id.toString())
    );
    if (!hasApplicableProduct) {
      return { applicable: false, reason: 'Coupon not applicable to these products' };
    }
  }
  
  if (this.applyTo === 'categories' && this.applicableCategories.length > 0) {
    const hasApplicableCategory = categoryIds.some(id => 
      this.applicableCategories.some(acId => acId.toString() === id.toString())
    );
    if (!hasApplicableCategory) {
      return { applicable: false, reason: 'Coupon not applicable to these categories' };
    }
  }
  
  // Check minimum purchase
  if (subtotal < this.minimumPurchase) {
    return { 
      applicable: false, 
      reason: `Minimum purchase of $${this.minimumPurchase} required` 
    };
  }
  
  // Calculate discount
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maximumDiscount) {
      discount = Math.min(discount, this.maximumDiscount);
    }
  } else {
    discount = this.discountValue;
  }
  
  return {
    applicable: true,
    discount: Math.round(discount * 100) / 100,
    finalTotal: subtotal - discount
  };
};

// Record usage
couponSchema.methods.recordUsage = async function(userId) {
  this.usageCount += 1;
  
  const userIndex = this.usedBy.findIndex(u => u.user.toString() === userId.toString());
  if (userIndex > -1) {
    this.usedBy[userIndex].count += 1;
    this.usedBy[userIndex].lastUsed = new Date();
  } else {
    this.usedBy.push({ user: userId, count: 1, lastUsed: new Date() });
  }
  
  return await this.save();
};

// Get usage statistics
couponSchema.methods.getStats = function() {
  return {
    totalUsage: this.usageCount,
    uniqueUsers: this.usedBy.length,
    remainingUses: this.usageLimit.total ? this.usageLimit.total - this.usageCount : null,
    isExpired: new Date() > this.endDate,
    daysUntilExpiry: Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24))
  };
};

module.exports = mongoose.model('Coupon', couponSchema);
