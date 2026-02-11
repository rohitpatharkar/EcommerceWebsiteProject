const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getProductBySlug,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getFilters,
  getFeaturedProducts,
  getNewArrivals,
  getBestsellers
} = require('../controllers/product.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validateProduct } = require('../middleware/validate.middleware');

// Public routes
router.get('/', getProducts);
router.get('/filters', getFilters);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/bestsellers', getBestsellers);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, adminOnly, validateProduct, createProduct);
router.put('/:id', protect, adminOnly, validateProduct, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.put('/:id/stock', protect, adminOnly, updateStock);

module.exports = router;
