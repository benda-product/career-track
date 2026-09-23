import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  deleteSavedJob,
  getCandidate,
  getJob,
  getOverview,
  getProfile,
  listActivity,
  listApplications,
  listCandidates,
  listJobs,
  listProfiles,
  listSavedJobs,
  updateApplication,
  updateCandidate,
} from '../modules/admin/admin.controller';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/overview', getOverview);
router.get('/candidates', listCandidates);
router.get('/candidates/:id', getCandidate);
router.patch('/candidates/:id', updateCandidate);
router.get('/profiles', listProfiles);
router.get('/profiles/:userId', getProfile);
router.get('/applications', listApplications);
router.patch('/applications/:id', updateApplication);
router.get('/saved-jobs', listSavedJobs);
router.delete('/saved-jobs/:id', deleteSavedJob);
router.get('/jobs', listJobs);
router.get('/jobs/:id', getJob);
router.get('/activity', listActivity);

export default router;
