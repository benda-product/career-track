import { Router } from 'express';
import { profileController } from '../modules/profile/profile.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, authorize('candidate'));

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.get('/completion', profileController.getCompletion);

export default router;
