import { Router } from 'express';
import { resumeController } from '../modules/resume/resume.controller';
import { authenticate, authorize, authorizeCandidateWorkspace } from '../middlewares/auth.middleware';
import { resumeUpload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);
router.get('/sso-url', authorizeCandidateWorkspace, resumeController.getSsoUrl);
router.get('/upgrade-url', authorizeCandidateWorkspace, resumeController.getUpgradeUrl);
router.use(authorize('candidate'));
router.get('/', resumeController.getResumes);
router.get('/entitlements', resumeController.getEntitlements);
router.post('/create', resumeController.createResume);
router.get('/templates', resumeController.getTemplates);
router.get('/templates/:id', resumeController.getTemplate);
router.post('/ats/check-upload', resumeUpload.single('resume'), resumeController.checkAtsUpload);
router.post('/ats/check/:id', resumeController.checkAts);
router.patch('/:id/viewable', resumeController.setViewable);
router.get('/:id/pdf', resumeController.downloadPdf);
router.get('/:id', resumeController.getResume);
router.put('/update/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.get('/score/:id', resumeController.getScore);
router.get('/:id/analytics', resumeController.getAnalytics);
router.get('/:id/suggestions', resumeController.getSuggestions);
router.get('/:id/versions', resumeController.getVersions);
router.get('/:id/preview', resumeController.getPreview);

export default router;
