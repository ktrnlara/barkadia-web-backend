import { Router } from 'express';
import { getUser, getUserPosts, getUserActivity } from '../controllers/userController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/:id', optionalAuth, getUser);
router.get('/:id/posts', optionalAuth, getUserPosts);
router.get('/:id/activity', optionalAuth, getUserActivity);

export default router;
