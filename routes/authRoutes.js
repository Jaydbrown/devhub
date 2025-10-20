import express from "express";
import { register, login, getCurrentUser } from "../controllers/authController.js";
import { validateRegistration, validateLogin } from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", validateRegistration, asyncHandler(register));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, asyncHandler(login));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticateToken, asyncHandler(getCurrentUser));

export default router;
