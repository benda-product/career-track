'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Building2, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { isAxiosError } from 'axios';
import { jobsService } from '@/services/jobs.service';
import { getPrimaryResumeId, resumeService } from '@/services/resume.service';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';

function JobDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const shouldAutoApply = searchParams.get('apply') === '1';
  const autoApplyTriggered = useRef(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id),
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: resumes, isLoading: resumesLoading, refetch: refetchResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
    enabled: isAuthenticated,
    retry: false,
  });

  const resumeList = resumes || [];
  const profileResumeId = profile?.user?.resumeId ?? null;

  const defaultResumeId = useMemo(() => {
    const jobData = job as { appliedResumeId?: string } | undefined;
    if (jobData?.appliedResumeId) return jobData.appliedResumeId;
    if (profileResumeId) return profileResumeId;
    return getPrimaryResumeId(resumeList);
  }, [job, profileResumeId, resumeList]);

  const hasApplied = Boolean((job as { hasApplied?: boolean } | undefined)?.hasApplied);
  const appliedResumeTitle = (job as { appliedResumeTitle?: string } | undefined)?.appliedResumeTitle;

  const clearApplyQuery = () => {
    if (searchParams.get('apply') === '1') {
      router.replace(`/jobs/${id}`, { scroll: false });
    }
  };

  const applyMutation = useMutation({
    mutationFn: (resumeId: string) => jobsService.applyToJob(id, resumeId),
    onSuccess: () => {
      setApplyError('');
      setApplyDialogOpen(false);
      setSuccessMessage('Application sent to Recruiter.');
      clearApplyQuery();
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      setTimeout(() => router.push('/applications'), 2000);
    },
    onError: (err: unknown) => {
      setSuccessMessage('');
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setApplyError(message || (err instanceof Error ? err.message : 'Failed to submit application.'));
    },
  });

  useEffect(() => {
    if (!shouldAutoApply || resumesLoading || autoApplyTriggered.current || hasApplied) return;

    if (resumeList.length === 1 && defaultResumeId) {
      autoApplyTriggered.current = true;
      applyMutation.mutate(defaultResumeId);
      return;
    }

    if (resumeList.length > 1) {
      autoApplyTriggered.current = true;
      setApplyDialogOpen(true);
      clearApplyQuery();
    }
  }, [shouldAutoApply, resumeList.length, defaultResumeId, resumesLoading, hasApplied]);

  async function openCreateResume() {
    setApplyError('');
    setRedirecting(true);
    try {
      const returnUrl = `${window.location.origin}/jobs/${id}?apply=1`;
      await resumeService.openInResumeBuilder({
        type: 'create',
        returnUrl,
      });
    } catch (err: unknown) {
      setRedirecting(false);
      setApplyError(
        err instanceof Error
          ? err.message
          : 'No resume found. Create one in Resume Builder with the same email as Career Track.'
      );
    }
  }

  async function handleApplyClick() {
    setApplyError('');
    setSuccessMessage('');

    if (hasApplied) {
      router.push('/applications');
      return;
    }

    if (resumesLoading) return;

    if (!resumeList.length) {
      await openCreateResume();
      return;
    }

    if (resumeList.length === 1 && defaultResumeId) {
      applyMutation.mutate(defaultResumeId);
      return;
    }

    setApplyDialogOpen(true);
  }

  function submitApplication(resumeId: string) {
    applyMutation.mutate(resumeId);
  }

  if (isLoading) return <Skeleton className="h-96" />;

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
  };

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
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {applyError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {applyError}
        </div>
      )}

      {redirecting && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting to Resume Builder to create your resume…
        </div>
      )}

      {!resumeList.length && !redirecting && !shouldAutoApply && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No resume found yet. Click Apply to create one in Resume Builder — you&apos;ll return here to choose it and submit.
        </div>
      )}

      <PageHeader
        title={jobData?.title || 'Job Details'}
        description={jobData?.company}
        action={
          <div className="flex gap-2">
            <SaveJobButton job={jobForSave} variant="outline" showLabel />
            {hasApplied ? (
              <Button variant="secondary" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Applied
              </Button>
            ) : (
              <Button
                onClick={() => void handleApplyClick()}
                disabled={applyMutation.isPending || redirecting || resumesLoading}
              >
                {(applyMutation.isPending || redirecting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Apply Now
              </Button>
            )}
          </div>
        }
      />

      {hasApplied && appliedResumeTitle ? (
        <p className="text-sm text-muted-foreground">
          Submitted with resume: <span className="font-medium text-foreground">{appliedResumeTitle}</span>
        </p>
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

          {jobData?.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {jobData.skills.map((skill, index) => (
                <Badge key={`${skill}-${index}`} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {jobData?.description || 'Job description will be loaded from the ATS integration.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <ApplyWithResumeDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        jobTitle={jobData?.title || 'this job'}
        company={jobData?.company}
        resumes={resumeList}
        defaultResumeId={defaultResumeId}
        profileResumeId={profileResumeId}
        submitting={applyMutation.isPending}
        onSubmit={submitApplication}
        onCreateResume={() => void openCreateResume()}
      />
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
