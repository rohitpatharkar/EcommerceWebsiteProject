const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    default: ''
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  images: [{
    url: { type: String, required: true }
  }],
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adminResponse: {
    comment: { type: String, maxlength: [1000, 'Response cannot exceed 1000 characters'] },
    respondedAt: { type: Date },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
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

// Compound index to prevent multiple reviews from same user on same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ createdAt: -1 });

// Update timestamp
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Mark as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return await this.save();
  }
  return this;
};

// Remove helpful mark
reviewSchema.methods.unmarkHelpful = async function(userId) {
  const index = this.helpful.users.indexOf(userId);
  if (index > -1) {
    this.helpful.users.splice(index, 1);
    this.helpful.count = Math.max(0, this.helpful.count - 1);
    return await this.save();
  }
  return this;
};

// Add admin response
reviewSchema.methods.addAdminResponse = async function(comment, adminId) {
  this.adminResponse = {
    comment,
    respondedAt: new Date(),
    respondedBy: adminId
  };
  return await this.save();
};

// Static method to get product rating stats
reviewSchema.statics.getProductRatingStats = async function(productId) {
  return await this.aggregate([
    { $match: { product: productId, isActive: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Review', reviewSchema);
