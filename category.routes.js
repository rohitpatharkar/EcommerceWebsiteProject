const express = require('express');
const router = express.Router();
const {
  getCategories,
  getAllCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
} = require('../controllers/category.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validateCategory } = require('../middleware/validate.middleware');

// Public routes
router.get('/', getCategories);
router.get('/all', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

// Admin routes
router.post('/', protect, adminOnly, validateCategory, createCategory);
router.put('/:id', protect, adminOnly, validateCategory, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
