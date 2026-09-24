import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

export type MessageParty = {
  _id: string;
  name: string;
  email?: string;
  role?: string;
};

export type MessageThread = {
  _id: string;
  threadId: string;
  body: string;
  createdAt: string;
  senderId: MessageParty | null;
  receiverId: MessageParty | null;
  applicationId?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  candidateName?: string | null;
};

export type MessageItem = {
  _id: string;
  threadId: string;
  body: string;
  createdAt: string;
  senderId: MessageParty | null;
  receiverId: MessageParty | null;
  applicationId?: string | null;
};

export const messagesService = {
  getThreads: async () => {
    const res = await apiClient.get<
      ApiResponse<{ threads: MessageThread[]; candidateId: string | null }>
    >('/messages/threads');
    return res.data.data!;
  },

  getMessages: async (threadId: string) => {
    const res = await apiClient.get<
      ApiResponse<{ messages: MessageItem[]; candidateId: string }>
    >(`/messages/threads/${encodeURIComponent(threadId)}`);
    return res.data.data!;
  },

  reply: async (payload: { body: string; threadId?: string; applicationId?: string }) => {
    const res = await apiClient.post<ApiResponse<{ message: MessageItem }>>(
      '/messages/reply',
      payload
    );
    return res.data.data!;
  },

  markRead: async (threadId: string) => {
    await apiClient.patch(`/messages/threads/${encodeURIComponent(threadId)}/read`);
  },
};
