const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variantDetails: {
    type: Map,
    of: String,
    default: {}
  }
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'USA' },
  phone: { type: String }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['card', 'paypal', 'cod', 'bank_transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema,
  payment: paymentSchema,
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
    default: 'pending'
  },
  timeline: [timelineEventSchema],
  tracking: {
    carrier: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    trackingUrl: { type: String, default: null },
    estimatedDelivery: { type: Date, default: null }
  },
  notes: {
    customer: { type: String, default: null },
    internal: { type: String, default: null }
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
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
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const prefix = 'ORD';
    const timestamp = date.getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `${prefix}-${timestamp}-${random}`;
    
    // Add initial timeline event
    this.timeline.push({
      status: 'pending',
      description: 'Order placed successfully',
      timestamp: new Date()
    });
  }
  
  this.updatedAt = Date.now();
  next();
});

// Update order status
orderSchema.methods.updateStatus = async function(status, description, updatedBy) {
  this.status = status;
  this.timeline.push({
    status,
    description: description || `Order status updated to ${status}`,
    updatedBy,
    timestamp: new Date()
  });
  return await this.save();
};

// Add tracking information
orderSchema.methods.addTracking = async function(carrier, trackingNumber, estimatedDelivery) {
  this.tracking = {
    carrier,
    trackingNumber,
    trackingUrl: this.generateTrackingUrl(carrier, trackingNumber),
    estimatedDelivery
  };
  return await this.save();
};

// Generate tracking URL
orderSchema.methods.generateTrackingUrl = function(carrier, trackingNumber) {
  const trackingUrls = {
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
  };
  return trackingUrls[carrier.toLowerCase()] || null;
};

// Process refund
orderSchema.methods.processRefund = async function(amount, reason) {
  this.payment.status = amount >= this.pricing.total ? 'refunded' : 'partially_refunded';
  this.payment.refundAmount = amount;
  this.payment.refundedAt = new Date();
  
  if (amount >= this.pricing.total) {
    this.status = 'refunded';
  }
  
  this.timeline.push({
    status: 'refunded',
    description: `Refund processed: $${amount}. Reason: ${reason}`,
    timestamp: new Date()
  });
  
  return await this.save();
};

// Cancel order
orderSchema.methods.cancel = async function(reason, updatedBy) {
  this.status = 'cancelled';
  this.timeline.push({
    status: 'cancelled',
    description: `Order cancelled. Reason: ${reason}`,
    updatedBy,
    timestamp: new Date()
  });
  return await this.save();
};

// Get order summary
orderSchema.methods.getSummary = function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    total: this.pricing.total,
    itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: this.createdAt,
    tracking: this.tracking
  };
};

// Static method to get sales statistics
orderSchema.statics.getSalesStats = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled', 'refunded'] }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$pricing.total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
