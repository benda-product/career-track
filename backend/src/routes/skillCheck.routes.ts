import { Router } from 'express';
import { skillCheckController } from '../modules/skillCheck/skillCheck.controller';
import { authenticate, authorize, authorizeCandidateWorkspace } from '../middlewares/auth.middleware';
import { requireInternalKey } from '../middlewares/internalAuth.middleware';

const router = Router();

router.post('/sync', requireInternalKey, skillCheckController.syncResults);

router.use(authenticate);
router.get('/sso-url', authorizeCandidateWorkspace, skillCheckController.getSsoUrl);
router.get('/upgrade-url', authorizeCandidateWorkspace, skillCheckController.getUpgradeUrl);
router.use(authorize('candidate'));
router.get('/entitlements', skillCheckController.getEntitlements);
router.get('/summary', skillCheckController.getSummary);
router.get('/history', skillCheckController.getHistory);
router.get('/certificates', skillCheckController.getCertificates);
router.get('/certificates/verify/:certificateId', skillCheckController.verifyCertificate);
router.get('/certificates/:testId', skillCheckController.getCertificateDetail);
router.get('/assignments', skillCheckController.getAssignments);
router.post('/refresh', skillCheckController.refreshFromPlatform);

export default router;
