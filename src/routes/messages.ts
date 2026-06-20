import { Router } from 'express';
import {
  getConversations,
  createOrGetConversation,
  getMessages,
  sendMessage,
  searchUsers
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/users', searchUsers);
router.get('/conversations', getConversations);
router.post('/conversations', createOrGetConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;
