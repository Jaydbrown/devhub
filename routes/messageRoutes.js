import express from 'express';
import {
  getMessages,
  getConversations,
  sendMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateMessage } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/messages
// @desc    Get all messages for current user
// @access  Private
router.get('/', authenticateToken, asyncHandler(getMessages));

// @route   GET /api/messages/conversations
// @desc    Get all conversations
// @access  Private
router.get('/conversations', authenticateToken, asyncHandler(getConversations));

// @route   POST /api/messages
// @desc    Send message
// @access  Private
router.post('/', authenticateToken, validateMessage, asyncHandler(sendMessage));

// @route   PATCH /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.patch('/:id/read', authenticateToken, asyncHandler(markAsRead));

// @route   PATCH /api/messages/read-all/:senderId
// @desc    Mark all messages from sender as read
// @access  Private
router.patch('/read-all/:senderId', authenticateToken, asyncHandler(markAllAsRead));

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private
router.delete('/:id', authenticateToken, asyncHandler(deleteMessage));

export default router;
