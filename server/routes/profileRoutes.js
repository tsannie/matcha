import express from 'express';
import { getProfile, getTags, updateProfile, updateProfileTags, getUserProfile } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/auth.js';
import { deletePhoto, setProfilePicture, uploadPhoto } from '../controllers/imageController.js';
import { upload } from '../utils/fileUpload.js';

const router = express.Router();

router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);

router.get('/tags', authenticateToken, getTags);
router.put('/tags', authenticateToken, updateProfileTags);

router.post('/images', authenticateToken, upload.single('image'), uploadPhoto);
router.delete('/images/:id', authenticateToken, deletePhoto);
router.put('/images/:id/set-profile', authenticateToken, setProfilePicture);

router.get('/:userId', authenticateToken, getUserProfile);

export default router;
