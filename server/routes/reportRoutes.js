import express from 'express';
import { reportUser, getMyReports } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get my reports
router.get('/', authenticateToken, getMyReports);

// Report a user
router.post('/:userId', authenticateToken, reportUser);

export default router;
