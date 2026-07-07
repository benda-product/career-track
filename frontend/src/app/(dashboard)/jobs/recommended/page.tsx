'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, Briefcase, ChevronRight, CheckCircle2, AlertCircle, Loader2, ArrowUpDown, Flame, HelpCircle, Search, SlidersHorizontal, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RecommendedJobCard } from '@/components/jobs/recommended-job-card';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { recommendedJobsService } from '@/services/recommendedJobs.service';
import { jobsService } from '@/services/jobs.service';
import { profileService } from '@/services/profile.service';
import { resumeService, getPrimaryResumeId, getResumeId } from '@/services/resume.service';
import { usePlanEntitlements } from '@/hooks/use-plan-entitlements';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { RecommendedJob } from '@/types';
import { cn } from '@/lib/utils';

export default function RecommendedJobsPage() {
  const queryClient = useQueryClient();
  
  // Local Filtering / Sorting / Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Inline Application States
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const { data: entitlements } = usePlanEntitlements();
  const jobFetchLimit = entitlements?.maxRecommendedJobs ?? 20;
  const hasPriorityInsights = Boolean(entitlements?.featureFlags?.priorityInsights);

  // Fetch recommended jobs (limit capped by plan)
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['recommended-jobs', jobFetchLimit],
    queryFn: () => recommendedJobsService.getRecommendedJobs(1, jobFetchLimit),
    retry: 1,
  });

  const { data: insights } = useQuery({
    queryKey: ['recommended-jobs-insights', jobFetchLimit],
    queryFn: () => recommendedJobsService.getInsights(),
    enabled: hasPriorityInsights,
    retry: false,
  });

  // Fetch Profile & Resumes for Apply Dialog
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    retry: false,
  });

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
    retry: false,
  });

  const rawJobs = data?.items || [];
  const resumeList = resumes || [];
  const profileResumeId = profile?.user?.resumeId ?? null;

  const defaultResumeId = useMemo(() => {
    if (!selectedJob) return null;
    if (selectedJob.appliedResumeId) return selectedJob.appliedResumeId;
    if (profileResumeId) return profileResumeId;
    return getPrimaryResumeId(resumeList);
  }, [selectedJob, profileResumeId, resumeList]);

  // Redirection link trigger for Resume Builder
  async function openCreateResume() {
    setApplyError('');
    setRedirecting(true);
    try {
      const returnUrl = `${window.location.origin}/jobs/recommended?apply=1`;
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

  // Application Mutation
  const applyMutation = useMutation({
    mutationFn: ({ jobId, resumeId }: { jobId: string; resumeId: string }) =>
      jobsService.applyToJob(jobId, resumeId),
    onSuccess: () => {
      setApplyError('');
      setApplyDialogOpen(false);
      setSuccessMessage(`Application submitted successfully for ${selectedJob?.title}!`);
      
      // Invalidate queries to update job state and application lists
      queryClient.invalidateQueries({ queryKey: ['recommended-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      // Auto clear message after 4s
      setTimeout(() => setSuccessMessage(''), 4000);
      setSelectedJob(null);
    },
    onError: (err: unknown) => {
      setSuccessMessage('');
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setApplyError(message || (err instanceof Error ? err.message : 'Failed to submit application.'));
    },
  });

  const handleApplyClick = (job: RecommendedJob) => {
    setSelectedJob(job);
    setApplyError('');
    setSuccessMessage('');

    if (resumesLoading) return;

    if (!resumeList.length) {
      void openCreateResume();
      return;
    }

    if (resumeList.length === 1 && defaultResumeId) {
      applyMutation.mutate({ jobId: job.id, resumeId: defaultResumeId });
      return;
    }

    setApplyDialogOpen(true);
  };

  const submitApplication = (resumeId: string) => {
    if (selectedJob) {
      applyMutation.mutate({ jobId: selectedJob.id, resumeId });
    }
  };

  // Priority insights (Career Pro) — fetched from gated API
  const metrics = useMemo(() => {
    if (hasPriorityInsights && insights) {
      return {
        averageScore: insights.averageScore,
        topMissing: insights.topMissingSkills,
        totalMatches: insights.totalMatches,
      };
    }

    return {
      averageScore: 0,
      topMissing: [] as string[],
      totalMatches: rawJobs.length,
    };
  }, [hasPriorityInsights, insights, rawJobs.length]);

  // Client Side Filtering and Sorting
  const filteredJobs = useMemo(() => {
    let result = [...rawJobs];

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location?.toLowerCase().includes(q)
      );
    }

    // Filter by match threshold score
    if (minMatchScore > 0) {
      result = result.filter((job) => job.matchScore >= minMatchScore);
    }

    // Sort items
    result.sort((a, b) => {
      if (sortBy === 'score') {
        return b.matchScore - a.matchScore;
      } else {
        const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return dateB - dateA;
      }
    });

    return result;
  }, [rawJobs, searchQuery, minMatchScore, sortBy]);

  // Client side pagination calculations
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommended Jobs"
        description="Personalized job matches automatically generated by analyzing your profile, qualifications, and assessment badges"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-9 px-4 font-semibold text-xs border-border/80 text-foreground hover:bg-muted/30">
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5 text-muted-foreground", isFetching && "animate-spin")} />
              Sync Matches
            </Button>
            <ButtonLink href="/jobs" variant="outline" className="h-9 px-4 font-semibold text-xs border-border/80">
              Browse All Jobs
            </ButtonLink>
          </div>
        }
      />

      {entitlements?.plan === 'free' ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Unlock priority job insights</p>
            <p className="text-xs text-muted-foreground">
              Career Pro shows match health, skill gap analysis, up to 100 matches, advanced analytics, and mock interview credits.
            </p>
          </div>
          <Link href="/billing?plan=pro">
            <Button size="sm">Upgrade to Career Pro</Button>
          </Link>
        </div>
      ) : null}

      {!hasPriorityInsights ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Match health and skill gap insights are available on Career Pro.
          </p>
        </div>
      ) : null}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {applyError && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-xs text-rose-800 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          {applyError}
        </div>
      )}

      {redirecting && (
        <div className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs text-sky-800 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
          Preparing Single Sign-On link to redirect you to Resume Builder to create your CV...
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <Card className="border-rose-100 bg-rose-50/15">
          <CardContent className="py-12 text-center max-w-sm mx-auto space-y-3">
            <div className="p-3 bg-rose-100/60 rounded-full text-rose-700 w-fit mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="font-bold text-foreground text-sm">Failed to Load Match suggestions</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {(error as Error)?.message || 'There was a network error syncing recommended vacancies. Please retry.'}
            </p>
            <div className="pt-2">
              <Button size="sm" onClick={() => refetch()} className="font-semibold text-xs px-4 h-9">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {hasPriorityInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Match Health</p>
                  <p className="text-xl font-black text-foreground mt-0.5">{metrics.averageScore}%</p>
                  <p className="text-[9px] text-muted-foreground font-medium truncate mt-0.5">Average compatibility of roles</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Flame className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Recommended Roles</p>
                  <p className="text-xl font-black text-foreground mt-0.5">{rawJobs.length}</p>
                  <p className="text-[9px] text-muted-foreground font-medium truncate mt-0.5">Total vacancies fitting qualifications</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Common Skills Needed</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {metrics.topMissing.length > 0 ? (
                      metrics.topMissing.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-[8px] font-bold py-0 px-1 bg-amber-500/5 text-amber-700 border-amber-500/10">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[9px] text-muted-foreground font-medium italic">Profile fully optimized</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          ) : null}

          {/* CONTROLS & FILTER TOOLBAR */}
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search query box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search matches by title, company, location..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 bg-background border border-border/80 rounded-xl text-xs h-9 placeholder:text-muted-foreground"
                  />
                </div>

                {/* Sort controller */}
                <div className="flex border rounded-xl overflow-hidden shrink-0 h-9 p-0.5 bg-muted/20">
                  <button
                    onClick={() => {
                      setSortBy('score');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-3 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                      sortBy === 'score'
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    Sort by Match Score
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('date');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-3 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                      sortBy === 'date'
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    Sort by Date
                  </button>
                </div>
              </div>

              {/* Slider for match score threshold */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-3.5">
                <div className="flex items-center gap-2 shrink-0">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-foreground font-bold uppercase tracking-wider">Minimum Match:</span>
                  <Badge variant="outline" className="text-[10px] font-extrabold bg-muted text-foreground border-0">
                    {minMatchScore}%
                  </Badge>
                </div>

                <div className="flex-1 max-w-md flex items-center gap-4">
                  <span className="text-[9px] text-muted-foreground font-semibold">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minMatchScore}
                    onChange={(e) => {
                      setMinMatchScore(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-primary outline-none"
                  />
                  <span className="text-[9px] text-muted-foreground font-semibold">100%</span>
                  
                  {minMatchScore > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMinMatchScore(0);
                        setCurrentPage(1);
                      }}
                      className="h-7 text-[9px] font-semibold text-muted-foreground hover:text-foreground border px-2 shrink-0"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MATCH COUNTER MESSAGE */}
          <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/40 px-3.5 py-2.5 text-[11px] text-muted-foreground font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            Showing {filteredJobs.length} matching role{filteredJobs.length === 1 ? '' : 's'} based on match filters (Total {rawJobs.length} active suggestions).
          </div>

          {/* RECOMMENDED ROLE LISTING CARDS */}
          {paginatedJobs.length === 0 ? (
            <Card className="border-dashed bg-muted/10">
              <CardContent className="py-12 text-center max-w-sm mx-auto space-y-2">
                <Briefcase className="h-10 w-10 text-muted-foreground/80 mx-auto" />
                <p className="font-bold text-foreground text-xs">No matching jobs found</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Try clearing your search filters or reducing the match score threshold slider constraints.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {paginatedJobs.map((job) => (
                <RecommendedJobCard
                  key={job.id}
                  job={job}
                  onApply={handleApplyClick}
                  isApplying={applyMutation.isPending && selectedJob?.id === job.id}
                />
              ))}
            </div>
          )}

          {/* PAGINATION PANEL */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground font-semibold">
                Page <span className="text-foreground font-bold">{currentPage}</span> of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-8 font-bold text-[10px] border"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-8 font-bold text-[10px] border"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* QUICK APPLY DIALOG DRAWER */}
      {selectedJob && (
        <ApplyWithResumeDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          jobTitle={selectedJob.title}
          company={selectedJob.company}
          resumes={resumeList}
          defaultResumeId={defaultResumeId}
          profileResumeId={profileResumeId}
          submitting={applyMutation.isPending}
          onSubmit={submitApplication}
          onCreateResume={() => void openCreateResume()}
        />
      )}
    </div>
  );
}
