'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Building2, DollarSign, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsService } from '@/services/jobs.service';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id),
    enabled: !!id,
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: () => jobsService.applyToJob(id, 'default-resume'),
    onSuccess: () => router.push('/applications'),
  });

  if (isLoading) return <Skeleton className="h-96" />;

  const jobData = job as {
    title?: string;
    company?: string;
    location?: string;
    salary?: string;
    employmentType?: string;
    remote?: boolean;
    description?: string;
    skills?: string[];
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={jobData?.title || 'Job Details'}
        description={jobData?.company}
        action={
          <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
            {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Now
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {jobData?.location && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{jobData.location}</span>
            )}
            {jobData?.employmentType && (
              <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{jobData.employmentType}</span>
            )}
            {jobData?.salary && (
              <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{jobData.salary}</span>
            )}
            {jobData?.remote && <Badge>Remote</Badge>}
          </div>

          {jobData?.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {jobData.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          ) : null}

          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {jobData?.description || 'Job description will be loaded from the ATS integration.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
