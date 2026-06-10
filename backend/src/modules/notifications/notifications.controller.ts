import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Notification } from './notification.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

export class NotificationsController {
  getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';

    const filter: Record<string, unknown> = { userId: req.user!.userId };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user!.userId, isRead: false }),
    ]);

    sendSuccess(res, { notifications, unreadCount }, 'Success', 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) throw new ApiError(404, 'Notification not found');
    sendSuccess(res, notification);
  });

  markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await Notification.updateMany(
      { userId: req.user!.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    sendSuccess(res, null, 'All notifications marked as read');
  });
}

export const notificationsController = new NotificationsController();
