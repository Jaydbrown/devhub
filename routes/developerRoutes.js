import express from "express";
import {
  getAllDevelopers,
  getDeveloperById,
  updateDeveloper,
  deleteDeveloper,
} from "../controllers/developerController.js";
import { authenticateToken, isDeveloper } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

// @route   GET /api/developers
// @desc    Get all developers (with filters)
// @access  Public
router.get("/", asyncHandler(getAllDevelopers));

// @route   GET /api/developers/:id
// @desc    Get single developer
// @access  Public
router.get("/:id", asyncHandler(getDeveloperById));

// @route   PUT /api/developers/:id
// @desc    Update developer profile
// @access  Private (Developer only)
router.put("/:id", authenticateToken, isDeveloper, asyncHandler(updateDeveloper));

// @route   DELETE /api/developers/:id
// @desc    Delete developer profile
// @access  Private (Developer only)
router.delete("/:id", authenticateToken, isDeveloper, asyncHandler(deleteDeveloper));

export default router;
