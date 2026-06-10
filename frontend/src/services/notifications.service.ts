import apiClient from '@/lib/api-client';
import { ApiResponse, Notification } from '@/types';

export const notificationsService = {
  getNotifications: async (page = 1, unreadOnly = false) => {
    const res = await apiClient.get<
      ApiResponse<{ notifications: Notification[]; unreadCount: number }>
    >('/notifications', { params: { page, unread: unreadOnly } });
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return res.data.data!;
  },

  markAllAsRead: async () => {
    await apiClient.patch('/notifications/read-all');
  },
};
