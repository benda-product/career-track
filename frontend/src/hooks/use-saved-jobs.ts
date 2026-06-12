'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '@/services/jobs.service';
import { Job } from '@/types';
import { jobToSavePayload, normalizeSavedJobs } from '@/utils/jobs';

export function useSavedJobs() {
  const queryClient = useQueryClient();

  const { data: savedJobs = [], isLoading } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await jobsService.getSavedJobs(1, 100);
      return normalizeSavedJobs(res.data);
    },
  });

  const savedIds = useMemo(() => new Set(savedJobs.map((job) => job.id)), [savedJobs]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: (job: Job) => jobsService.saveJob(jobToSavePayload(job)),
    onSuccess: invalidate,
  });

  const unsaveMutation = useMutation({
    mutationFn: (jobId: string) => jobsService.unsaveJob(jobId),
    onSuccess: invalidate,
  });

  const isSaved = (jobId: string) => savedIds.has(jobId);

  const saveJob = async (job: Job) => {
    await saveMutation.mutateAsync(job);
  };

  const unsaveJob = async (jobId: string) => {
    await unsaveMutation.mutateAsync(jobId);
  };

  const toggleSave = async (job: Job) => {
    if (isSaved(job.id)) {
      await unsaveJob(job.id);
    } else {
      await saveJob(job);
    }
  };

  const isToggling = (jobId: string) =>
    (saveMutation.isPending && saveMutation.variables?.id === jobId) ||
    (unsaveMutation.isPending && unsaveMutation.variables === jobId);

  return {
    savedJobs,
    savedIds,
    isLoading,
    isSaved,
    saveJob,
    unsaveJob,
    toggleSave,
    isToggling,
    isSaving: saveMutation.isPending,
    isUnsaving: unsaveMutation.isPending,
  };
}
