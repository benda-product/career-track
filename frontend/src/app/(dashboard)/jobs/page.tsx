'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MapPin, ExternalLink, Building, DollarSign, Calendar, Sparkles, AlertCircle, Loader2, Search, SlidersHorizontal, ChevronDown, Bookmark } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { jobsService } from '@/services/jobs.service';
import { EMPLOYMENT_TYPES } from '@/constants';
import { normalizeJobsPayload } from '@/utils/jobs';
import { Job } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { JobDetailSections } from '@/components/jobs/job-detail-sections';
import { buildJobDescriptionPreview, hasJobDescriptionContent } from '@/lib/job-content';
import { useJobApply } from '@/hooks/use-job-apply';

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosErr = error as { response?: { data?: { message?: string } }; message?: string };
  const message = axiosErr.response?.data?.message || axiosErr.message;
  if (message && !/^Request failed with status code \d+$/.test(message)) {
    return message;
  }
  return fallback;
}

function JobsContent() {

  // Search filter states
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  // Expandable description card state
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['jobs', query, location, employmentType],
    queryFn: () =>
      jobsService.searchJobs({
        query: query.trim() || undefined,
        location: location.trim() || undefined,
        employmentType: employmentType && employmentType !== 'All' ? employmentType : undefined,
      }),
    retry: 1,
  });

  const jobs: Job[] = normalizeJobsPayload(data?.data);

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

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800">
          <p className="font-semibold">Unable to load jobs from Talent Desk.</p>
          <p className="mt-1 text-xs text-rose-700">
            {getApiErrorMessage(
              error,
              'Please confirm Talent Desk and Career Track backends are running, then retry.'
            )}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

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
                      <Button
                        size="sm"
                        onClick={() => openApply(job)}
                        className="h-8 text-[10px] font-black bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
                      >
                        Apply
                      </Button>
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
                        <div className="pt-3 border-t border-border/20 mt-2 space-y-3">
                          <h4 className="text-xs font-bold text-foreground">Full Job Details</h4>
                          {hasJobDescriptionContent(job) || job.benefits?.length ? (
                            <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                              <JobDetailSections job={job} showSkills={false} />
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 border border-border/40 p-3 rounded-xl">
                              {buildJobDescriptionPreview(job) || 'No job description provided from the ATS platform integration.'}
                            </p>
                          )}
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
        jobTitle={applyJob?.title || 'Role'}
        company={applyJob?.company}
        resumes={resumes}
        defaultResumeId={defaultResumeId}
        profileResumeId={profileResumeId}
        submitting={submitting}
        onSubmit={(resumeId) => void submitApply(resumeId)}
        onCreateResume={createResume}
      />
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
