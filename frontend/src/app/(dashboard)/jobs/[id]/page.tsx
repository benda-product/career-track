'use client';

import { Suspense, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Building2, DollarSign, ExternalLink } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { JobRecommendedAssessment } from '@/components/jobs/job-recommended-assessment';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsService } from '@/services/jobs.service';
import { useAuthStore } from '@/store/auth.store';
import { dedupeSkills, sanitizeJobDescriptionHtml } from '@/lib/job-content';
import { openTalentDeskApply } from '@/lib/talent-desk-apply';

function JobDetailContent() {
  const { id } = useParams<{ id: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [assessmentDetailsOpen, setAssessmentDetailsOpen] = useState(false);

  const { data: job, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id),
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-96" />;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        <p className="font-semibold">Unable to load this job right now.</p>
        <p className="text-rose-800">
          {error instanceof Error ? error.message : 'The jobs service may be unavailable. Check that Career Track and Talent Desk backends are running.'}
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const jobData = job as {
    id?: string;
    title?: string;
    company?: string;
    location?: string;
    salary?: string;
    employmentType?: string;
    remote?: boolean;
    description?: string;
    skills?: string[];
    applyUrl?: string;
    recommendedAssessment?: {
      id: string;
      name: string;
      title: string;
      recommendedFor: string;
      bendaLanguage: string;
      targetPath: string;
      prerequisite?: string;
      levels: string[];
      optional: true;
    } | null;
  };

  const recommendedAssessment = jobData?.recommendedAssessment || null;
  const uniqueSkills = dedupeSkills(jobData?.skills);
  const descriptionHtml = sanitizeJobDescriptionHtml(jobData?.description);

  const jobForSave = {
    id: jobData.id || id,
    title: jobData.title || 'Job Title',
    company: jobData.company || 'Company',
    location: jobData.location,
    salary: jobData.salary,
    employmentType: jobData.employmentType,
    remote: jobData.remote,
    skills: jobData.skills,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Applications for Talent Desk jobs are submitted on Talent Desk. Use the button below to continue in a new tab.
      </div>

      <PageHeader
        title={jobData?.title || 'Job Details'}
        description={jobData?.company}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            {recommendedAssessment ? (
              <Button variant="outline" onClick={() => setAssessmentDetailsOpen(true)}>
                View Recommended Test
              </Button>
            ) : null}
            <SaveJobButton job={jobForSave} variant="outline" showLabel />
            <Button onClick={() => openTalentDeskApply(jobData.id || id, jobData.applyUrl)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Apply on Talent Desk
            </Button>
          </div>
        }
      />

      {recommendedAssessment ? (
        <JobRecommendedAssessment
          assessment={recommendedAssessment}
          detailsOpen={assessmentDetailsOpen}
          onDetailsOpenChange={setAssessmentDetailsOpen}
        />
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {jobData?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {jobData.location}
              </span>
            )}
            {jobData?.employmentType && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {jobData.employmentType}
              </span>
            )}
            {jobData?.salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {jobData.salary}
              </span>
            )}
            {jobData?.remote && <Badge>Remote</Badge>}
          </div>

          {uniqueSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {uniqueSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="prose prose-sm max-w-none">
            {descriptionHtml ? (
              <div
                className="text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="text-muted-foreground">
                Job description will be loaded from the ATS integration.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <JobDetailContent />
    </Suspense>
  );
}
