import { Router } from 'express';
import { 
  createPost, 
  getPosts, 
  getPost, 
  updatePost, 
  deletePost, 
  likePost,
  getTrendingTags
} from '../controllers/postController';
import { createComment, getComments } from '../controllers/commentController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/trending', optionalAuth, getTrendingTags);
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);
router.get('/:id/comments', optionalAuth, getComments);

// Protected routes
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);
router.post('/:id/comments', authenticate, createComment);

export default router;
