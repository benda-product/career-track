import { Router } from 'express';
import { skillCheckController } from '../modules/skillCheck/skillCheck.controller';
import { requireInternalKey } from '../middlewares/internalAuth.middleware';

const router = Router();

router.post('/skill-check/assign', requireInternalKey, skillCheckController.assignFromAts);

export default router;
