import express from 'express';
import { getRecommendations } from '../controllers/browsingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/recommendations', authenticateToken, getRecommendations);

export default router;
