import express from 'express';
import { recordProfileView, getProfileViews } from '../controllers/viewController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateNotBlocked } from '../middleware/likeValidation.js';

const router = express.Router();

// Get who viewed my profile
router.get('/', authenticateToken, getProfileViews);

// Record a profile view (with block validation)
router.post('/:userId', authenticateToken, validateNotBlocked, recordProfileView);

export default router;
