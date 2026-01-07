import express from 'express';
import { blockUser, unblockUser, getBlockedUsers } from '../controllers/blockController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get blocked users
router.get('/', authenticateToken, getBlockedUsers);

// Block a user
router.post('/:userId', authenticateToken, blockUser);

// Unblock a user
router.delete('/:userId', authenticateToken, unblockUser);

export default router;
