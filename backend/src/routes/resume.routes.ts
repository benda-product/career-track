import { Router } from 'express';
import { resumeController } from '../modules/resume/resume.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, authorize('candidate'));

router.get('/', resumeController.getResumes);
router.post('/create', resumeController.createResume);
router.get('/templates', resumeController.getTemplates);
router.get('/templates/:id', resumeController.getTemplate);
router.get('/:id', resumeController.getResume);
router.put('/update/:id', resumeController.updateResume);
router.get('/score/:id', resumeController.getScore);
router.get('/:id/pdf', resumeController.downloadPdf);
router.get('/:id/analytics', resumeController.getAnalytics);
router.get('/:id/suggestions', resumeController.getSuggestions);
router.get('/:id/versions', resumeController.getVersions);
router.get('/:id/preview', resumeController.getPreview);

export default router;
