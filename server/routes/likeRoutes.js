import express from 'express';
import {
  likeUser,
  unlikeUser,
  getLikesReceived,
  getLikesSent,
  getMatches,
  checkLikeStatus
} from '../controllers/likeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCanLike, validateNotBlocked } from '../middleware/likeValidation.js';

const router = express.Router();

// Get endpoints (must come before :userId routes)
router.get('/received', authenticateToken, getLikesReceived);
router.get('/sent', authenticateToken, getLikesSent);
router.get('/matches', authenticateToken, getMatches);
router.get('/status/:userId', authenticateToken, checkLikeStatus);

// Action endpoints with validation
router.post('/:userId', authenticateToken, validateCanLike, validateNotBlocked, likeUser);
router.delete('/:userId', authenticateToken, unlikeUser);

export default router;
