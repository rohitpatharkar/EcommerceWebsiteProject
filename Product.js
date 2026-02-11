const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  options: [{ type: String, required: true }]
}, { _id: false });

const inventorySchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  variantCombination: { type: Map, of: String }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative'],
    default: 0
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  variants: [variantSchema],
  inventory: [inventorySchema],
  totalQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  weight: {
    value: { type: Number, default: 0 },
    unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' }
  },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    unit: { type: String, enum: ['cm', 'in', 'm'], default: 'cm' }
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  salesCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    maxlength: [70, 'Meta title cannot exceed 70 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
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

// Indexes for search and filtering
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isBestseller: 1 });
productSchema.index({ createdAt: -1 });

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }
  
  // Calculate total quantity from inventory
  if (this.isModified('inventory')) {
    this.totalQuantity = this.inventory.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  this.updatedAt = Date.now();
  next();
});

// Check if product is in stock
productSchema.methods.isInStock = function() {
  return this.totalQuantity > 0;
};

// Check if specific variant is in stock
productSchema.methods.isVariantInStock = function(sku) {
  const item = this.inventory.find(inv => inv.sku === sku);
  return item ? item.quantity > 0 : false;
};

// Update stock after purchase
productSchema.methods.updateStock = async function(sku, quantity) {
  const item = this.inventory.find(inv => inv.sku === sku);
  if (item) {
    item.quantity = Math.max(0, item.quantity - quantity);
    this.totalQuantity = this.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    await this.save();
  }
};

// Get primary image
productSchema.methods.getPrimaryImage = function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : this.images[0]?.url || '';
};

// Calculate discount percentage
productSchema.methods.getDiscountPercentage = function() {
  if (this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
};

// Update rating
productSchema.methods.updateRating = async function(newRating) {
  const oldTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (oldTotal + newRating) / this.rating.count;
  this.rating.distribution[newRating] += 1;
  this.reviewsCount = this.rating.count;
  await this.save();
};

module.exports = mongoose.model('Product', productSchema);
