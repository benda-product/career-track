import { Router } from 'express';
import { skillCheckController } from '../modules/skillCheck/skillCheck.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { requireInternalKey } from '../middlewares/internalAuth.middleware';

const router = Router();

router.post('/sync', requireInternalKey, skillCheckController.syncResults);

router.use(authenticate, authorize('candidate'));
router.get('/sso-url', skillCheckController.getSsoUrl);
router.get('/summary', skillCheckController.getSummary);
router.get('/history', skillCheckController.getHistory);
router.get('/certificates', skillCheckController.getCertificates);
router.get('/certificates/verify/:certificateId', skillCheckController.verifyCertificate);
router.get('/certificates/:testId', skillCheckController.getCertificateDetail);
router.get('/assignments', skillCheckController.getAssignments);
router.post('/refresh', skillCheckController.refreshFromPlatform);

export default router;
