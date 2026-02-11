const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  variantDetails: {
    type: Map,
    of: String,
    default: {}
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    code: { type: String, default: null },
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }
  },
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  this.lastUpdated = Date.now();
  next();
});

// Calculate cart totals
cartSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Calculate discount
  if (this.coupon && this.coupon.code) {
    if (this.coupon.discountType === 'percentage') {
      this.discount = (this.subtotal * this.coupon.discount) / 100;
    } else {
      this.discount = this.coupon.discount;
    }
  } else {
    this.discount = 0;
  }
  
  // Calculate tax (8% default)
  this.tax = (this.subtotal - this.discount) * 0.08;
  
  // Calculate shipping (free over $50)
  this.shipping = this.subtotal > 50 ? 0 : 5.99;
  
  // Calculate total
  this.total = this.subtotal - this.discount + this.tax + this.shipping;
};

// Add item to cart
cartSchema.methods.addItem = async function(product, sku, quantity, variantDetails) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === product._id.toString() && item.sku === sku
  );
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    const inventoryItem = product.inventory.find(inv => inv.sku === sku);
    const price = product.price;
    
    this.items.push({
      product: product._id,
      sku,
      quantity,
      price,
      variantDetails: variantDetails || {}
    });
  }
  
  this.calculateTotals();
  return await this.save();
};

// Update item quantity
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      this.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }
    this.calculateTotals();
    return await this.save();
  }
  return null;
};

// Remove item from cart
cartSchema.methods.removeItem = async function(itemId) {
  this.items.pull(itemId);
  this.calculateTotals();
  return await this.save();
};

// Clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.coupon = { code: null, discount: 0, discountType: 'percentage' };
  this.calculateTotals();
  return await this.save();
};

// Apply coupon
cartSchema.methods.applyCoupon = async function(code, discount, discountType) {
  this.coupon = { code, discount, discountType };
  this.calculateTotals();
  return await this.save();
};

// Remove coupon
cartSchema.methods.removeCoupon = async function() {
  this.coupon = { code: null, discount: 0, discountType: 'percentage' };
  this.calculateTotals();
  return await this.save();
};

// Get item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((count, item) => count + item.quantity, 0);
};

// Check if cart is empty
cartSchema.methods.isEmpty = function() {
  return this.items.length === 0;
};

module.exports = mongoose.model('Cart', cartSchema);
