import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  suspendUser,
  getAllProjectsAdmin,
  deleteProject,
  getAllReviewsAdmin,
  deleteReview,
  getAnalytics,
  updateSettings,
  getSettings,
} from "../controllers/adminController.js";
import { authenticateToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // For now, check if email contains 'admin'
  // In production, add an 'is_admin' column to users table
  const user = req.user;

  if (!user?.email?.includes("admin")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get("/dashboard", authenticateToken, isAdmin, asyncHandler(getDashboardStats));

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get("/users", authenticateToken, isAdmin, asyncHandler(getAllUsers));

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete("/users/:id", authenticateToken, isAdmin, asyncHandler(deleteUser));

// @route   PATCH /api/admin/users/:id/suspend
// @desc    Suspend/Activate user
// @access  Private (Admin only)
router.patch("/users/:id/suspend", authenticateToken, isAdmin, asyncHandler(suspendUser));

// @route   GET /api/admin/projects
// @desc    Get all projects
// @access  Private (Admin only)
router.get("/projects", authenticateToken, isAdmin, asyncHandler(getAllProjectsAdmin));

// @route   DELETE /api/admin/projects/:id
// @desc    Delete project
// @access  Private (Admin only)
router.delete("/projects/:id", authenticateToken, isAdmin, asyncHandler(deleteProject));

// @route   GET /api/admin/reviews
// @desc    Get all reviews
// @access  Private (Admin only)
router.get("/reviews", authenticateToken, isAdmin, asyncHandler(getAllReviewsAdmin));

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete review
// @access  Private (Admin only)
router.delete("/reviews/:id", authenticateToken, isAdmin, asyncHandler(deleteReview));

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin only)
router.get("/analytics", authenticateToken, isAdmin, asyncHandler(getAnalytics));

// @route   GET /api/admin/settings
// @desc    Get platform settings
// @access  Private (Admin only)
router.get("/settings", authenticateToken, isAdmin, asyncHandler(getSettings));

// @route   PUT /api/admin/settings
// @desc    Update platform settings
// @access  Private (Admin only)
router.put("/settings", authenticateToken, isAdmin, asyncHandler(updateSettings));

export default router;
