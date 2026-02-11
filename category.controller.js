const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true, parent: null })
    .populate({
      path: 'getSubcategories',
      match: { isActive: true },
      select: 'name slug image'
    })
    .sort({ order: 1, name: 1 });

  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get all categories (flat list)
// @route   GET /api/categories/all
// @access  Public
exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .sort({ name: 1 });

  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    $or: [
      { _id: req.params.id },
      { slug: req.params.id }
    ],
    isActive: true
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Get subcategories
  const subcategories = await Category.find({ 
    parent: category._id, 
    isActive: true 
  });

  res.json({
    success: true,
    data: {
      ...category.toObject(),
      subcategories
    }
  });
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const subcategories = await Category.find({ 
    parent: category._id, 
    isActive: true 
  });

  res.json({
    success: true,
    data: {
      ...category.toObject(),
      subcategories
    }
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if category has subcategories
  const subcategories = await Category.find({ parent: category._id });
  if (subcategories.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete category with subcategories. Delete subcategories first.'
    });
  }

  // Soft delete
  category.isActive = false;
  await category.save();

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true });
  
  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => 
        parentId === null 
          ? !cat.parent 
          : cat.parent && cat.parent.toString() === parentId.toString()
      )
      .map(cat => ({
        ...cat.toObject(),
        children: buildTree(cat._id)
      }));
  };

  const tree = buildTree();

  res.json({
    success: true,
    data: tree
  });
});
