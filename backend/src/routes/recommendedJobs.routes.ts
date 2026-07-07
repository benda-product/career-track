import { Router } from 'express';
import { recommendationController } from '../modules/jobs/recommendation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('candidate'),
  recommendationController.getRecommendedJobs
);

router.get(
  '/insights',
  authenticate,
  authorize('candidate'),
  recommendationController.getInsights
);

export default router;
