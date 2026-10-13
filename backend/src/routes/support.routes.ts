import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { authController } from '../modules/auth/auth.controller';

const router = Router();

router.get('/accounts', authenticate, authorize('support'), authController.supportAccountLookup);

export default router;
