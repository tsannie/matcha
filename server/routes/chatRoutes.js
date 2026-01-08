import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateMatch, validateMessage } from '../middleware/chatValidation.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead
} from '../controllers/chatController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get list of conversations
router.get('/conversations', getConversations);

// Get messages with specific user (requires match)
router.get('/messages/:userId', validateMatch, getMessages);

// Send message (HTTP fallback, requires match)
router.post('/send/:userId', validateMatch, validateMessage, sendMessage);

// Mark messages as read
router.patch('/read/:userId', validateMatch, markMessagesAsRead);

export default router;
