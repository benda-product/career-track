import { Router } from 'express';
import { applicationsController } from '../modules/applications/applications.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, authorize('candidate'));

router.get('/', applicationsController.getApplications);
router.get('/analytics', applicationsController.getAnalytics);
router.get('/:id', applicationsController.getApplication);
router.patch('/:id/stage', applicationsController.updateStage);

export default router;
