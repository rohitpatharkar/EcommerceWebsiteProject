const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    default: ''
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
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

// Index for search
categorySchema.index({ name: 'text', description: 'text' });

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }
  this.updatedAt = Date.now();
  next();
});

// Get subcategories
categorySchema.methods.getSubcategories = async function() {
  return await this.model('Category').find({ parent: this._id });
};

module.exports = mongoose.model('Category', categorySchema);
