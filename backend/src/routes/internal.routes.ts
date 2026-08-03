import { Router } from 'express';
import { skillCheckController } from '../modules/skillCheck/skillCheck.controller';
import { applicationInternalController } from '../modules/applications/application-internal.controller';
import { bendaInfotechController } from '../modules/internal/bendaInfotech.controller';
import { ecosystemInternalController } from '../modules/internal/ecosystem.controller';
import { requireInternalKey } from '../middlewares/internalAuth.middleware';

const router = Router();

router.post('/sso-session', requireInternalKey, ecosystemInternalController.createSsoSession);

router.post('/skill-check/assign', requireInternalKey, skillCheckController.assignFromAts);
router.post(
  '/applications/stage-sync',
  requireInternalKey,
  applicationInternalController.syncStageFromAts
);
router.get(
  '/benda-infotech/account-lookup',
  requireInternalKey,
  bendaInfotechController.accountLookup
);
router.post(
  '/benda-infotech/verify-credentials',
  requireInternalKey,
  bendaInfotechController.verifyCredentials
);
router.post(
  '/benda-infotech/link-account',
  requireInternalKey,
  bendaInfotechController.linkAccount
);
router.post(
  '/benda-infotech/provision',
  requireInternalKey,
  bendaInfotechController.provisionJobSeeker
);
router.post(
  '/benda-infotech/sync-password',
  requireInternalKey,
  bendaInfotechController.syncPassword
);
router.get(
  '/benda-infotech/subscriptions',
  requireInternalKey,
  bendaInfotechController.listSubscriptions
);

export default router;
