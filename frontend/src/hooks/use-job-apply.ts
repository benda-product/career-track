'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '@/services/jobs.service';
import { resumeService } from '@/services/resume.service';
import { profileService } from '@/services/profile.service';
import { getResumeId } from '@/services/resume.service';
import type { Job, RecommendedJob } from '@/types';

type ApplyJob = Job | RecommendedJob;

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosErr = error as { response?: { data?: { message?: string } }; message?: string };
  const message = axiosErr.response?.data?.message || axiosErr.message;
  if (message && !/^Request failed with status code \d+$/.test(message)) {
    return message;
  }
  return fallback;
}

export function useJobApply() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [applyJob, setApplyJob] = useState<ApplyJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');

  const { data: resumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getResumes(),
    enabled: Boolean(applyJob),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: Boolean(applyJob),
  });

  const openApply = (job: ApplyJob) => {
    setApplyError('');
    setApplyJob(job);
  };

  const closeApply = () => {
    if (submitting) return;
    setApplyJob(null);
    setApplyError('');
  };

  const submitApply = async (resumeId: string) => {
    if (!applyJob) return;
    setApplyError('');
    setSubmitting(true);
    try {
      await jobsService.applyToJob(applyJob.id, resumeId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['recommended-jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      setApplyJob(null);
      router.push('/applications/status');
    } catch (error) {
      setApplyError(getApiErrorMessage(error, 'Unable to submit your application right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  const createResume = () => {
    void resumeService.openInResumeBuilder({
      type: 'create',
      returnUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  };

  const profileResumeId = profile?.user?.resumeId || null;
  const defaultResumeId =
    profileResumeId ||
    (resumes.find((resume) => getResumeId(resume) === profileResumeId)
      ? profileResumeId
      : getResumeId(resumes[0] || {})) ||
    null;

  return {
    applyJob,
    openApply,
    closeApply,
    submitApply,
    submitting,
    applyError,
    resumes,
    resumesLoading,
    profileResumeId,
    defaultResumeId,
    createResume,
  };
}
