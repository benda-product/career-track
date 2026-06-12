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

export default router;
