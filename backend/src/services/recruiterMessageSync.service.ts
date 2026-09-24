import { applicationRepository } from '../repositories/application.repository';
import { userRepository } from '../repositories/user.repository';
import { Notification } from '../modules/notifications/notification.model';
import { emitNotification } from '../sockets/notification.socket';
import { logger } from '../utils/logger';

/**
 * Talent (ATS) recruiter → Career Track candidate message bridge.
 * Creates an in-app Career Track notification after Talent sends email.
 */
export async function notifyRecruiterMessageFromAts(input: {
  atsApplicationId?: string;
  candidateEmail?: string;
  subject?: string;
  preview?: string;
  jobTitle?: string;
  companyName?: string;
  recruiterName?: string;
  communicationId?: string;
  threadId?: string;
  channel?: string;
}) {
  const atsApplicationId = String(input.atsApplicationId || '').trim();
  const candidateEmail = String(input.candidateEmail || '')
    .trim()
    .toLowerCase();

  let userId: string | null = null;
  let applicationId: string | undefined;
  let jobTitle = input.jobTitle || '';
  let company = input.companyName || '';

  if (atsApplicationId) {
    const application = await applicationRepository.findByAtsApplicationId(atsApplicationId);
    if (application) {
      userId = String(application.userId);
      applicationId = String(application._id);
      jobTitle = jobTitle || application.jobTitle || '';
      company = company || application.company || '';
    }
  }

  if (!userId && candidateEmail) {
    const user = await userRepository.findByEmail(candidateEmail);
    if (user) userId = String(user._id);
  }

  if (!userId) {
    return { notified: false, reason: 'candidate_not_found' as const };
  }

  const recruiterLabel = String(input.recruiterName || 'Hiring team').trim() || 'Hiring team';
  const subject = String(input.subject || 'Message from hiring team').trim();
  const preview = String(input.preview || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

  const context =
    jobTitle && company
      ? `${jobTitle} at ${company}`
      : jobTitle || company || 'your application';

  const isChat = input.channel === 'in_app_message' || Boolean(input.threadId);
  const notification = await Notification.create({
    userId,
    type: 'recruiter_message',
    title: isChat ? 'New message from hiring team' : 'Message from hiring team',
    message: preview
      ? `${recruiterLabel} messaged you about ${context}: ${subject} — ${preview}`
      : `${recruiterLabel} messaged you about ${context}: ${subject}`,
    data: {
      source: 'talent',
      atsApplicationId: atsApplicationId || undefined,
      applicationId,
      subject,
      preview,
      jobTitle: jobTitle || undefined,
      company: company || undefined,
      recruiterName: recruiterLabel,
      communicationId: input.communicationId || undefined,
      threadId: input.threadId || undefined,
      channel: input.channel || 'email',
      deepLink: input.threadId
        ? `/messages?thread=${encodeURIComponent(input.threadId)}`
        : applicationId
          ? `/applications/${applicationId}`
          : '/messages',
    },
  });

  emitNotification(userId, notification);

  logger.info('Recruiter message notified on Career Track', {
    userId,
    atsApplicationId: atsApplicationId || null,
    communicationId: input.communicationId || null,
  });

  return {
    notified: true,
    notificationId: String(notification._id),
    userId,
    applicationId,
  };
}
