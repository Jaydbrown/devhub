import express from 'express';
import {
  getDeveloperReviews,
  addReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { authenticateToken, isClient } from '../middleware/auth.js';
import { validateReview } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/reviews/developer/:developerId
// @desc    Get all reviews for a developer
// @access  Public
router.get('/developer/:developerId', asyncHandler(getDeveloperReviews));

// @route   POST /api/reviews
// @desc    Add review for developer
// @access  Private (Client only)
router.post('/', authenticateToken, isClient, validateReview, asyncHandler(addReview));

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private (Review owner only)
router.put('/:id', authenticateToken, asyncHandler(updateReview));

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private (Review owner only)
router.delete('/:id', authenticateToken, asyncHandler(deleteReview));

export default router;
