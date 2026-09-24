import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { messagesController } from '../modules/messages/messages.controller';

const router = Router();

router.use(authenticate);
router.get('/threads', messagesController.listThreads);
router.get('/threads/:threadId', messagesController.listMessages);
router.post('/reply', messagesController.reply);
router.patch('/threads/:threadId/read', messagesController.markRead);

export default router;
