import { Router } from 'express';
import { jobsController } from '../modules/jobs/jobs.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('candidate'), jobsController.searchJobs);
router.get('/saved', authenticate, authorize('candidate'), jobsController.getSavedJobs);
router.get('/recent', authenticate, authorize('candidate'), jobsController.getRecentlyViewed);
router.get('/recommended', authenticate, authorize('candidate'), jobsController.getRecommended);
router.get('/:id', authenticate, authorize('candidate'), jobsController.getJob);
router.post('/:id/apply', authenticate, authorize('candidate'), jobsController.applyToJob);
router.post('/save', authenticate, authorize('candidate'), jobsController.saveJob);
router.delete('/:id/save', authenticate, authorize('candidate'), jobsController.unsaveJob);

export default router;
