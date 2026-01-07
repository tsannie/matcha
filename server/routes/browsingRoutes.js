import express from 'express';
import { getRecommendations, searchUsers } from '../controllers/browsingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/recommendations', authenticateToken, getRecommendations);
router.get('/search', authenticateToken, searchUsers);

export default router;
