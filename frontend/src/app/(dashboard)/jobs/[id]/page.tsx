'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building2, DollarSign, MapPin } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { JobRecommendedAssessment } from '@/components/jobs/job-recommended-assessment';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { JobAuthDialog } from '@/components/jobs/job-auth-dialog';
import { JobDetailSections } from '@/components/jobs/job-detail-sections';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsService } from '@/services/jobs.service';
import { useAuthStore } from '@/store/auth.store';
import { dedupeSkills, formatJobType, formatRemoteMode } from '@/lib/job-content';
import { useJobApply } from '@/hooks/use-job-apply';
import type { Job } from '@/types';

function JobDetailContent() {
  const { id } = useParams<{ id: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const role = useAuthStore((s) => s.user?.role);
  const [assessmentDetailsOpen, setAssessmentDetailsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [authPrompt, setAuthPrompt] = useState<'apply' | 'incompatible' | null>(null);

  const {
    applyJob,
    openApply,
    closeApply,
    submitApply,
    submitting,
    applyError,
    resumes,
    profileResumeId,
    defaultResumeId,
    createResume,
  } = useJobApply();

  const { data: job, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id),
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('saved') !== '1') return;
    setNotice('Job saved successfully.');
    params.delete('saved');
    params.delete('jobId');
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', next);
  }, []);

  if (isLoading) return <Skeleton className="h-96" />;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        <p className="font-semibold">Unable to load this job right now.</p>
        <p className="text-rose-800">
          {error instanceof Error ? error.message : 'The jobs service may be unavailable. Check that Career Track and Talent backends are running.'}
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const jobData = (job || {}) as Job;
  const recommendedAssessment = jobData.recommendedAssessment || null;
  const uniqueSkills = dedupeSkills(jobData.skills);
  const remoteLabel = formatRemoteMode(undefined, jobData.remote, jobData.hybrid);

  const jobForSave = {
    id: jobData.id || id,
    title: jobData.title || 'Job Title',
    company: jobData.company || 'Company',
    companyLogo: jobData.companyLogo,
    location: jobData.location,
    salary: jobData.salary,
    employmentType: jobData.employmentType,
    remote: jobData.remote,
    skills: jobData.skills,
  };

  const jobForApply = {
    ...jobForSave,
    id: jobData.id || id,
    applyUrl: jobData.applyUrl,
  };

  const requestApply = () => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      setAuthPrompt('apply');
      return;
    }
    if (role !== 'candidate') {
      setAuthPrompt('incompatible');
      return;
    }
    openApply(jobForApply);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={jobData.title || 'Job Details'}
        description={jobData.company}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            {recommendedAssessment ? (
              <Button variant="outline" onClick={() => setAssessmentDetailsOpen(true)}>
                View Recommended Test
              </Button>
            ) : null}
            <SaveJobButton job={jobForSave} variant="outline" showLabel />
            <Button onClick={requestApply}>
              Apply
            </Button>
          </div>
        }
      />

      {notice ? (
        <p className="rounded-xl border border-[var(--ct-line)] bg-[var(--ct-tint)] px-4 py-3 text-sm font-semibold text-[var(--ct-green-deep)]" role="status">
          {notice}
        </p>
      ) : null}

      {applyError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {applyError}
        </div>
      ) : null}

      <ApplyWithResumeDialog
        open={Boolean(applyJob)}
        onOpenChange={(open) => {
          if (!open) closeApply();
        }}
        jobTitle={applyJob?.title || jobData.title || 'Role'}
        company={applyJob?.company || jobData.company}
        resumes={resumes}
        defaultResumeId={defaultResumeId}
        profileResumeId={profileResumeId}
        submitting={submitting}
        onSubmit={(resumeId) => void submitApply(resumeId)}
        onCreateResume={createResume}
      />
      <JobAuthDialog
        open={Boolean(authPrompt)}
        mode={authPrompt || 'apply'}
        job={jobForSave}
        onOpenChange={(open) => {
          if (!open) setAuthPrompt(null);
        }}
      />

      {recommendedAssessment ? (
        <JobRecommendedAssessment
          assessment={recommendedAssessment}
          detailsOpen={assessmentDetailsOpen}
          onDetailsOpenChange={setAssessmentDetailsOpen}
        />
      ) : null}

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {jobData.companyLogo ? (
              <img
                src={jobData.companyLogo}
                alt=""
                className="h-10 w-10 rounded-xl border border-border/80 bg-white object-contain p-1"
              />
            ) : null}
            <span className="font-semibold text-foreground">{jobData.company}</span>
            {jobData.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {jobData.location}
              </span>
            ) : null}
            {remoteLabel ? <Badge variant="outline">{remoteLabel}</Badge> : null}
            {jobData.employmentType ? (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {formatJobType(jobData.employmentType)}
              </span>
            ) : null}
            {jobData.department ? (
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {jobData.department}
              </span>
            ) : null}
            {jobData.salary ? (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {jobData.salary}
              </span>
            ) : null}
          </div>

          {(jobData.minExperience != null || jobData.maxExperience != null || jobData.openings || jobData.jobReferenceId) ? (
            <div className="flex flex-wrap gap-2">
              {jobData.minExperience != null || jobData.maxExperience != null ? (
                <Badge variant="secondary">
                  Experience:{' '}
                  {jobData.minExperience != null && jobData.maxExperience != null
                    ? `${jobData.minExperience}–${jobData.maxExperience} yrs`
                    : jobData.minExperience != null
                      ? `${jobData.minExperience}+ yrs`
                      : `Up to ${jobData.maxExperience} yrs`}
                </Badge>
              ) : null}
              {jobData.openings ? (
                <Badge variant="secondary">{jobData.openings} opening{jobData.openings === 1 ? '' : 's'}</Badge>
              ) : null}
              {jobData.jobReferenceId ? (
                <Badge variant="outline">Ref: {jobData.jobReferenceId}</Badge>
              ) : null}
            </div>
          ) : null}

          {uniqueSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {uniqueSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}

          <JobDetailSections job={jobData} showSkills={false} />
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
