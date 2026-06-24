import { Router } from 'express';
import { skillCheckController } from '../modules/skillCheck/skillCheck.controller';
import { applicationInternalController } from '../modules/applications/application-internal.controller';
import { bendaInfotechController } from '../modules/internal/bendaInfotech.controller';
import { requireInternalKey } from '../middlewares/internalAuth.middleware';

const router = Router();

router.post('/skill-check/assign', requireInternalKey, skillCheckController.assignFromAts);
router.post(
  '/applications/stage-sync',
  requireInternalKey,
  applicationInternalController.syncStageFromAts
);
router.post(
  '/benda-infotech/provision',
  requireInternalKey,
  bendaInfotechController.provisionJobSeeker
);

export default router;
