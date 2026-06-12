'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RecommendedJobCard,
  RecommendedJobsEmptyState,
} from '@/components/jobs/recommended-job-card';
import { recommendedJobsService } from '@/services/recommendedJobs.service';

export default function RecommendedJobsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['recommended-jobs', page],
    queryFn: () => recommendedJobsService.getRecommendedJobs(page, limit),
    retry: 1,
  });

  const jobs = data?.items || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommended Jobs"
        description="Personalized matches based on your profile, resume, skills, and activity"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
            <ButtonLink href="/jobs" variant="outline">
              Browse All Jobs
            </ButtonLink>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message || 'Failed to load recommended jobs.'}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <RecommendedJobsEmptyState />
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Showing {jobs.length} of {meta?.total ?? jobs.length} recommended roles ranked by match score.
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <RecommendedJobCard key={job.id} job={job} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
