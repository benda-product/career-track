import { RESUME_BUILDER_URL } from '@/constants';

export function getResumeBuilderPath(
  type: 'create' | 'edit' | 'ats',
  resumeId?: string
): string {
  if (type === 'create') return '/dashboard/resumes/new';
  if (type === 'ats') return '/dashboard/ats';
  if (type === 'edit' && resumeId) return `/dashboard/resumes/${resumeId}/edit`;
  return '/dashboard';
}
