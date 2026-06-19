'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, MapPin, ExternalLink, Building, DollarSign, Calendar, Sparkles, CheckCircle2, AlertCircle, Loader2, Search, SlidersHorizontal, ChevronDown, Bookmark } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsService } from '@/services/jobs.service';
import { profileService } from '@/services/profile.service';
import { resumeService, getPrimaryResumeId } from '@/services/resume.service';
import { EMPLOYMENT_TYPES } from '@/constants';
import { normalizeJobsPayload } from '@/utils/jobs';
import { Job } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { isAxiosError } from 'axios';

function JobsContent() {
  const queryClient = useQueryClient();

  // Search filter states
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  // Expandable description card state
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Inline Application states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  // Fetch search results
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['jobs', query, location, employmentType],
    queryFn: () => jobsService.searchJobs({ query, location, employmentType }),
    retry: false,
  });

  // Fetch Profile & Resumes for Inline Apply Dialog
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

  const jobs: Job[] = normalizeJobsPayload(data?.data);
  const resumeList = resumes || [];
  const profileResumeId = profile?.user?.resumeId ?? null;

  const defaultResumeId = useMemo(() => {
    if (!selectedJob) return null;
    if (selectedJob.appliedResumeId) return selectedJob.appliedResumeId;
    if (profileResumeId) return profileResumeId;
    return getPrimaryResumeId(resumeList);
  }, [selectedJob, profileResumeId, resumeList]);

  // SSO Link Redirection for CV Builder
  async function openCreateResume() {
    setApplyError('');
    setRedirecting(true);
    try {
      const returnUrl = `${window.location.origin}/jobs?apply=1`;
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
      
      // Invalidate queries to update job applied badge states
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      refetch();
      
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

  const handleApplyClick = (job: Job) => {
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

  const handleToggleExpand = (id: string) => {
    setExpandedJobId((prev) => (prev === id ? null : id));
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = jobs.length;
    const remoteCount = jobs.filter((j) => j.remote).length;
    const hybridCount = jobs.filter((j) => j.hybrid).length;
    return { total, remoteCount, hybridCount };
  }, [jobs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs Board"
        description="Explore active recruitment opportunities integrated from our ATS platform partner pipelines"
        action={
          <div className="flex gap-2">
            <ButtonLink href="/jobs/saved" variant="outline" className="h-9 px-4 font-semibold text-xs border-border/80">
              Saved Jobs
            </ButtonLink>
            <ButtonLink href="/jobs/search" variant="outline" className="h-9 px-4 font-semibold text-xs border-border/80">
              Advanced Search
            </ButtonLink>
          </div>
        }
      />

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-emerald-800 shadow-sm animate-in fade-in-50 duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {applyError && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-xs text-rose-800 shadow-sm animate-in fade-in-50 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          {applyError}
        </div>
      )}

      {redirecting && (
        <div className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs text-sky-800 shadow-sm animate-in fade-in-50 duration-200">
          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
          Preparing SSO credentials for CV Builder...
        </div>
      )}

      {/* THREE-COLUMN STATS PANEL */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-border/85 shadow-sm bg-card/60">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Active Positions</p>
              <p className="text-xl font-black text-foreground mt-0.5">{metrics.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/85 shadow-sm bg-card/60">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Remote / Hybrid</p>
              <p className="text-xl font-black text-foreground mt-0.5">
                {metrics.remoteCount} <span className="text-xs font-semibold text-muted-foreground">/ {metrics.hybridCount}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/85 shadow-sm bg-card/60">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Recommendations</p>
              <Link href="/jobs/recommended" className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline mt-1">
                Personalized Matches
                <ChevronDown className="-rotate-90 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UNIFIED CONTROLS SEARCH TOOLBAR */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="relative md:col-span-5 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by keywords, title, company..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-background border border-border/80 rounded-xl text-xs h-9 placeholder:text-muted-foreground"
              />
            </div>

            <div className="relative md:col-span-3 w-full">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9 bg-background border border-border/80 rounded-xl text-xs h-9 placeholder:text-muted-foreground"
              />
            </div>

            <div className="md:col-span-2 w-full">
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v || '')}>
                <SelectTrigger className="bg-background border border-border/80 rounded-xl text-xs h-9 text-muted-foreground font-semibold">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectTrigger className="hidden" /> {/* HACK to override default select arrow offset styles */}
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 w-full">
              <Button
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-full h-9 rounded-xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Find Jobs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JOB LISTINGS FEED */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center py-14 text-center max-w-sm mx-auto space-y-3">
            <div className="p-3 bg-muted rounded-full text-muted-foreground">
              <Briefcase className="h-7 w-7" />
            </div>
            <p className="font-bold text-foreground text-sm">No vacancies match search criteria</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Try adjusting your keyword query, location settings, or employment type selectors.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {jobs.map((job, i) => {
            const isExpanded = expandedJobId === job.id;
            const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : 'C';
            
            return (
              <Card
                key={job.id || i}
                className="relative overflow-hidden border-border/80 shadow-sm pl-3.5 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 before:bg-primary transition-all duration-200 hover:shadow-md hover:border-primary/45"
              >
                <CardContent className="p-4.5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Company Initial Badge & Details Grid */}
                    <div className="flex gap-3.5 items-start">
                      <div className="h-11 w-11 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm select-none shadow-sm uppercase">
                        {companyInitial}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm tracking-tight sm:text-base leading-snug truncate">{job.title || 'Job Title'}</h3>
                          {job.remote && (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 shrink-0">
                              Remote
                            </Badge>
                          )}
                          {job.hybrid && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 shrink-0">
                              Hybrid
                            </Badge>
                          )}
                          {job.hasApplied && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 shrink-0">
                              Applied
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground font-semibold">{job.company}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold pt-0.5">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {job.location}
                            </span>
                          )}
                          {job.salary && (
                            <span className="flex items-center gap-0.5">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {job.salary}
                            </span>
                          )}
                          {job.employmentType && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {job.employmentType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick apply triggers */}
                    <div className="flex shrink-0 gap-2 items-center justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0">
                      <SaveJobButton job={{ ...job, id: job.id || String(i) }} variant="outline" />
                      {job.hasApplied ? (
                        <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold gap-1 border" disabled>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Applied
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleApplyClick(job)}
                          disabled={applyMutation.isPending && selectedJob?.id === job.id}
                          className="h-8 text-[10px] font-black bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
                        >
                          {applyMutation.isPending && selectedJob?.id === job.id && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          Apply Now
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Skills constraints */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/20">
                      {job.skills.map((skill, index) => (
                        <Badge key={`${skill}-${index}`} variant="outline" className="bg-muted/30 text-[9px] font-bold py-0.5 px-2 border-border/80">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Collapsible description snippet */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-border/20 mt-2 space-y-1.5">
                          <h4 className="text-xs font-bold text-foreground">Vacancy Description</h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 border border-border/40 p-3 rounded-xl">
                            {job.description || 'No job description provided from the ATS platform integration.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action panel footer */}
                  <div className="flex gap-2 justify-start pt-2.5 border-t border-border/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleExpand(job.id || String(i))}
                      className="h-7 font-semibold text-[9px] border gap-1 hover:bg-muted/30 px-2.5"
                    >
                      {isExpanded ? 'Hide Description' : 'View Description'}
                      <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                    </Button>
                    
                    <ButtonLink href={`/jobs/${job.id || i}`} size="sm" variant="ghost" className="h-7 text-[9px] font-bold border px-2.5">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View Details Page
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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

export default function JobsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <JobsContent />
    </Suspense>
  );
}
