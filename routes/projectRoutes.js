import express from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateProject } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects (with filters)
// @access  Private
router.get('/', authenticateToken, asyncHandler(getAllProjects));

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(getProjectById));

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (Client only)
router.post('/', authenticateToken, validateProject, asyncHandler(createProject));

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Project owner only)
router.put('/:id', authenticateToken, asyncHandler(updateProject));

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Project owner only)
router.delete('/:id', authenticateToken, asyncHandler(deleteProject));

export default router;
