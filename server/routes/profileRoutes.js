import express from 'express';
import { getProfile, getTags, updateProfile, updateProfileTags } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);

router.get('/tags', authenticateToken, getTags);
router.put('/tags', authenticateToken, updateProfileTags);

export default router;
