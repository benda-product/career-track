import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

export interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  duration: string;
  level: string;
  imageKey: 'website' | 'uiux' | 'app';
  pdfUrl: string | null;
  sortOrder: number;
}

export const coursesService = {
  getCategories: async () => {
    const res = await apiClient.get<ApiResponse<string[]>>('/courses/categories');
    return res.data.data || [];
  },

  listCourses: async (category?: string) => {
    const res = await apiClient.get<ApiResponse<CourseItem[]>>('/courses', {
      params: category ? { category } : undefined,
    });
    return res.data.data || [];
  },

  getCourse: async (slug: string) => {
    const res = await apiClient.get<ApiResponse<CourseItem>>(`/courses/${slug}`);
    return res.data.data!;
  },

  openCoursePdf: async (slug: string) => {
    const tab = window.open('about:blank', '_blank');
    if (!tab) {
      throw new Error('Pop-up blocked. Please allow pop-ups to view the course PDF.');
    }

    try {
      const res = await apiClient.get<ApiResponse<{ url: string | null; hasPdf?: boolean }>>(
        `/courses/${slug}/pdf-url`
      );
      const url = res.data.data?.url;

      if (url) {
        tab.location.replace(url);
        tab.opener = null;
        return;
      }

      const pdfRes = await apiClient.get(`/courses/${slug}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      tab.location.replace(blobUrl);
      tab.opener = null;
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      tab.close();
      throw error;
    }
  },
};
