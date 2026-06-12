'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Loader2, MapPin, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsService } from '@/services/jobs.service';
import { normalizeSavedJobs } from '@/utils/jobs';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { Job } from '@/types';

export default function SavedJobsPage() {
  const { unsaveJob, isToggling } = useSavedJobs();

  const { data: savedJobs = [], isLoading, refetch } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await jobsService.getSavedJobs(1, 50);
      return normalizeSavedJobs(res.data);
    },
  });

  const uniqueCompanies = new Set(savedJobs.map((job) => job.company)).size;

  async function handleRemove(job: Job) {
    await unsaveJob(job.id);
    refetch();
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Jobs"
        description="Jobs you've bookmarked for later"
        action={<ButtonLink href="/jobs" variant="outline">Browse Jobs</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/40 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Saved</p>
            <p className="text-2xl font-bold">{savedJobs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Companies</p>
            <p className="text-2xl font-bold">{uniqueCompanies}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Remote Roles</p>
            <p className="text-2xl font-bold">{savedJobs.filter((job) => job.remote).length}</p>
          </CardContent>
        </Card>
      </div>

      {savedJobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No saved jobs yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Save jobs while browsing to review and apply later.
            </p>
            <ButtonLink href="/jobs">Explore Jobs</ButtonLink>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedJobs.map((job) => (
            <Card key={job.id} className="border-border/40 bg-card/50 transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{job.title}</h3>
                    {job.remote && <Badge variant="secondary">Remote</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                    )}
                    {job.salary && <span>{job.salary}</span>}
                    {job.employmentType && <span>{job.employmentType}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ButtonLink href={`/jobs/${job.id}`} size="sm">
                    Apply Now
                  </ButtonLink>
                  <ButtonLink href={`/jobs/${job.id}`} size="sm" variant="outline">
                    View Details
                  </ButtonLink>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isToggling(job.id)}
                    onClick={() => handleRemove(job)}
                  >
                    {isToggling(job.id) ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1 h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Need more roles? <Link href="/jobs" className="text-primary underline-offset-4 hover:underline">Browse all jobs</Link>
      </p>
    </div>
  );
}
