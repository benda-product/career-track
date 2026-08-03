import { applicationRepository } from '../repositories/application.repository';
import { Notification } from '../modules/notifications/notification.model';
import { emitApplicationUpdate, emitNotification } from '../sockets/notification.socket';
import { formatAtsStageLabel, mapAtsStageToCareerTrack } from '../utils/atsStageMapper';
import { logger } from '../utils/logger';
import { ApplicationStage } from '../types';

export async function syncApplicationStageFromAts(input: {
  atsApplicationId: string;
  stage: string;
  previousStage?: string;
  note?: string;
  jobTitle?: string;
  recruiterName?: string;
}) {
  const atsApplicationId = String(input.atsApplicationId || '').trim();
  if (!atsApplicationId) {
    return { synced: false, reason: 'missing_ats_application_id' as const };
  }

  const application = await applicationRepository.findByAtsApplicationId(atsApplicationId);
  if (!application) {
    return { synced: false, reason: 'not_found' as const };
  }

  const mappedStage = mapAtsStageToCareerTrack(input.stage);
  const atsLabel = formatAtsStageLabel(input.stage);
  const timelineNote =
    input.note?.trim() ||
    `Recruiter updated your application to ${atsLabel}${
      input.recruiterName ? ` (${input.recruiterName})` : ''
    }`;

  const stageUnchanged = application.stage === mappedStage;
  const lastTimelineNote = application.timeline?.[application.timeline.length - 1]?.note || '';
  const atsStageUnchanged = (application.atsStage || '') === String(input.stage || '');
  if (stageUnchanged && atsStageUnchanged && lastTimelineNote === timelineNote) {
    return { synced: false, reason: 'unchanged' as const, application };
  }

  const updated = await applicationRepository.updateStage(
    application._id.toString(),
    mappedStage as ApplicationStage,
    timelineNote,
    input.recruiterName || 'ATS Recruiter',
    input.stage
  );

  if (!updated) {
    return { synced: false, reason: 'update_failed' as const };
  }

  const jobTitle = input.jobTitle || updated.jobTitle || 'your application';
  const notification = await Notification.create({
    userId: updated.userId,
    type: 'application_update',
    title: 'Application status updated',
    message: `Your application for ${jobTitle} is now: ${atsLabel}`,
    data: {
      applicationId: String(updated._id),
      atsApplicationId,
      stage: mappedStage,
      atsStage: input.stage,
      previousStage: input.previousStage || application.stage,
      jobTitle: updated.jobTitle,
      company: updated.company,
    },
  });

  const userId = String(updated.userId);
  emitNotification(userId, notification);
  emitApplicationUpdate(userId, {
    applicationId: String(updated._id),
    atsApplicationId,
    stage: updated.stage,
    atsStage: input.stage,
    jobTitle: updated.jobTitle,
    company: updated.company,
    timeline: updated.timeline,
    updatedAt: updated.updatedAt,
  });

  logger.info('Application stage synced from ATS', {
    atsApplicationId,
    applicationId: String(updated._id),
    stage: mappedStage,
    atsStage: input.stage,
  });

  return { synced: true, application: updated };
}
