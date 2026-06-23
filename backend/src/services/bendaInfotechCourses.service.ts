import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export interface BendaCourse {
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

interface CoursesListResponse {
  courses: BendaCourse[];
}

interface CourseResponse {
  course: BendaCourse;
}

interface CategoriesResponse {
  categories: string[];
}

class BendaInfotechCoursesService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.bendaInfotech.apiUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async request<T>(
    method: string,
    url: string,
    config?: { responseType?: 'arraybuffer'; params?: Record<string, string> }
  ) {
    try {
      const response = await this.client.request<T>({
        method,
        url,
        ...config,
      });
      return response;
    } catch (error) {
      logger.error('Benda Infotech courses API error', { url, error });
      if (axios.isAxiosError(error)) {
        const isDown = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
        throw new ApiError(
          error.response?.status || 502,
          isDown
            ? 'Benda Infotech course service is not running. Start it on port 5004.'
            : (error.response?.data as { message?: string })?.message ||
                'Unable to load courses right now.'
        );
      }
      throw new ApiError(502, 'Unable to load courses right now.');
    }
  }

  async listCourses(category?: string) {
    const response = await this.request<CoursesListResponse>(
      'GET',
      '/courses',
      category ? { params: { category } } : undefined
    );
    return response.data.courses || [];
  }

  async getCategories() {
    const response = await this.request<CategoriesResponse>('GET', '/courses/categories');
    return response.data.categories || [];
  }

  async getCourse(slug: string) {
    const response = await this.request<CourseResponse>('GET', `/courses/${encodeURIComponent(slug)}`);
    if (!response.data.course) {
      throw new ApiError(404, 'Course not found.');
    }
    return response.data.course;
  }
}

export const bendaInfotechCoursesService = new BendaInfotechCoursesService();
