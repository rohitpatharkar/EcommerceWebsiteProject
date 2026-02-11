const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  unmarkHelpful,
  getMyReviews,
  addAdminResponse,
  getAllReviews,
  toggleReviewStatus
} = require('../controllers/review.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validateReview } = require('../middleware/validate.middleware');

// Public routes
router.get('/product/:productId', getProductReviews);
router.get('/:id', getReview);

// Protected routes
router.get('/my/reviews', protect, getMyReviews);
router.post('/', protect, validateReview, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, markHelpful);
router.put('/:id/unhelpful', protect, unmarkHelpful);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllReviews);
router.put('/admin/:id/response', protect, adminOnly, addAdminResponse);
router.put('/admin/:id/toggle', protect, adminOnly, toggleReviewStatus);

module.exports = router;
