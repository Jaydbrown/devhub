import express from 'express';
import {
  getClientStats,
  getDeveloperStats,
  getPlatformStats,
} from '../controllers/statsController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/stats/client/:id
// @desc    Get client statistics
// @access  Private
router.get('/client/:id', authenticateToken, asyncHandler(getClientStats));

// @route   GET /api/stats/developer/:id
// @desc    Get developer statistics
// @access  Private
router.get('/developer/:id', authenticateToken, asyncHandler(getDeveloperStats));

// @route   GET /api/stats/platform
// @desc    Get platform-wide statistics
// @access  Public
router.get('/platform', optionalAuth, asyncHandler(getPlatformStats));

export default router;
