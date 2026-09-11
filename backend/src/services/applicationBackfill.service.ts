import { provisionApplicationFromAtsApply } from './applicationProvision.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import axios from 'axios';
import { atsApiBases } from './ats.service';

type AtsApplicationRow = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string | null;
  location?: string;
  atsStage?: string;
  jobReferenceId?: string | null;
  fullName?: string;
  phone?: string;
  source?: string;
};

async function fetchAtsApplicationsByEmail(email: string): Promise<AtsApplicationRow[]> {
  const normalized = String(email || '').toLowerCase().trim();
  if (!normalized) return [];

  const headers = {
    'Content-Type': 'application/json',
    'x-benda-key': env.internalSyncKey,
    'x-benda-internal-key': env.internalSyncKey,
  };

  for (const base of atsApiBases()) {
    try {
      const response = await axios.get(
        `${base}/external/benda-infotech/candidate-applications`,
        {
          params: { email: normalized },
          headers,
          timeout: 12000,
        }
      );
      const payload = response.data?.data ?? response.data ?? {};
      const rows = Array.isArray(payload.applications) ? payload.applications : [];
      return rows as AtsApplicationRow[];
    } catch (error) {
      logger.warn('ATS candidate-applications lookup failed', {
        base,
        email: normalized,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        message: axios.isAxiosError(error) ? error.response?.data : undefined,
      });
    }
  }

  return [];
}

/**
 * Import missing Talent Desk applications for a signed-in Career Track user.
 * Covers apply-time sync failures and signup-after-apply flows.
 */
export async function backfillUserApplicationsFromAts(
  userId: string,
  email: string,
  fullName?: string
) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!userId || !normalizedEmail) {
    return { synced: 0, total: 0, skipped: true };
  }

  const rows = await fetchAtsApplicationsByEmail(normalizedEmail);
  if (!rows.length) {
    return { synced: 0, total: 0 };
  }

  let synced = 0;
  for (const row of rows) {
    const result = await provisionApplicationFromAtsApply({
      email: normalizedEmail,
      fullName: row.fullName || fullName || normalizedEmail.split('@')[0] || 'Applicant',
      phone: row.phone,
      atsApplicationId: row.applicationId,
      atsJobId: row.jobId,
      jobTitle: row.jobTitle,
      company: row.company,
      companyLogo: row.companyLogo || undefined,
      location: row.location,
      atsStage: row.atsStage,
      source: row.source || 'talent_desk_apply_backfill',
      jobReferenceId: row.jobReferenceId || undefined,
      targetUserId: userId,
    });

    if (result.ok) {
      synced += 1;
      if (result.userId && result.userId !== userId) {
        logger.warn('Career Track backfill userId mismatch', {
          expectedUserId: userId,
          provisionUserId: result.userId,
          email: normalizedEmail,
          atsApplicationId: row.applicationId,
        });
      }
    }
  }

  if (synced > 0) {
    logger.info('Career Track applications backfilled from Talent Desk', {
      email: normalizedEmail,
      userId,
      synced,
      total: rows.length,
    });
  }

  return { synced, total: rows.length };
}
