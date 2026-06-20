import { Router } from 'express';
import { register, login, getProfile, updateProfile, createAdminUser } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Admin-only routes
router.post('/create-admin', authenticate, requireAdmin, createAdminUser);

export default router;
