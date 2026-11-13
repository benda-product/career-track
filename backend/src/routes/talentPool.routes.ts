import { Router, Request } from 'express';
import { requireTalentPoolKey } from '../middlewares/talentPoolAuth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import {
  getTalentPoolCandidate,
  searchTalentPool,
  TalentPoolFilters,
} from '../services/talentPoolDirectory.service';

const router = Router();

function auditCaller(req: Request) {
  return {
    recruiterId: String(req.headers['x-talent-desk-recruiter'] || '').slice(0, 64) || 'unknown',
    companyId: String(req.headers['x-talent-desk-company'] || '').slice(0, 64) || 'unknown',
  };
}

function queryFilters(req: Request): TalentPoolFilters {
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') filters[key] = value;
  }
  return filters;
}

router.use(requireTalentPoolKey);

router.get(
  '/candidates',
  asyncHandler(async (req, res) => {
    const result = await searchTalentPool(queryFilters(req));
    logger.info('[talent-pool] search', { ...auditCaller(req), returned: result.candidates.length });
    res.json(result);
  })
);

router.get(
  '/candidates/:id',
  asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const candidate = await getTalentPoolCandidate(String(id));
    logger.info('[talent-pool] profile view', { ...auditCaller(req), found: Boolean(candidate) });
    if (!candidate) throw new ApiError(404, 'Candidate not found');
    res.json({ candidate });
  })
);

export default router;
