export type UserRole = 'candidate' | 'admin';

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'hired';

export type NotificationType =
  | 'job_match'
  | 'application_update'
  | 'resume_score'
  | 'interview_invite'
  | 'profile_suggestion'
  | 'system';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
