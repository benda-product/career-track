import { Router } from 'express';
import { coachingController } from '../modules/coaching/coaching.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get(
  '/entitlements',
  authenticate,
  authorize('candidate'),
  coachingController.getEntitlements
);

router.post(
  '/request',
  authenticate,
  authorize('candidate'),
  coachingController.requestSession
);

export default router;
