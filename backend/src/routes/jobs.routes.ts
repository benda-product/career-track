import { Router } from 'express';
import { jobsController } from '../modules/jobs/jobs.controller';
import { authenticate, authenticateOptional, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateOptional, jobsController.searchJobs);
router.get('/saved', authenticate, authorize('candidate'), jobsController.getSavedJobs);
router.get('/recent', authenticate, authorize('candidate'), jobsController.getRecentlyViewed);
router.get('/recommended', authenticate, authorize('candidate'), jobsController.getRecommended);
router.get('/:id', authenticateOptional, jobsController.getJob);
router.post('/:id/apply', authenticate, authorize('candidate'), jobsController.applyToJob);
router.post('/save', authenticate, authorize('candidate'), jobsController.saveJob);
router.delete('/:id/save', authenticate, authorize('candidate'), jobsController.unsaveJob);

export default router;
