'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Loader2, MapPin, Trash2, Building, DollarSign, Calendar, Search, SlidersHorizontal, Briefcase, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { jobsService } from '@/services/jobs.service';
import { normalizeSavedJobs } from '@/utils/jobs';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { Job } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { useJobApply } from '@/hooks/use-job-apply';

export default function SavedJobsPage() {
  const { unsaveJob, isToggling } = useSavedJobs();

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [workstyleFilter, setWorkstyleFilter] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');

  const { data: savedJobs = [], isLoading, refetch } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await jobsService.getSavedJobs(1, 50);
      return normalizeSavedJobs(res.data);
    },
    retry: false,
  });

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

  async function handleRemove(job: Job) {
    await unsaveJob(job.id);
    refetch();
  }

  // Metrics summary
  const metrics = useMemo(() => {
    const total = savedJobs.length;
    const uniqueCompanies = new Set(savedJobs.map((job) => job.company)).size;
    const remoteCount = savedJobs.filter((job) => job.remote).length;
    const hybridCount = savedJobs.filter((job) => job.hybrid).length;
    return { total, uniqueCompanies, remoteCount, hybridCount };
  }, [savedJobs]);

  // Client Side Search and Filtering
  const filteredJobs = useMemo(() => {
    let result = [...savedJobs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location?.toLowerCase().includes(q)
      );
    }

    if (workstyleFilter !== 'all') {
      result = result.filter((job) => {
        if (workstyleFilter === 'remote') return job.remote;
        if (workstyleFilter === 'hybrid') return job.hybrid;
        if (workstyleFilter === 'onsite') return !job.remote && !job.hybrid;
        return true;
      });
    }

    return result;
  }, [savedJobs, searchQuery, workstyleFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Jobs"
        description="Review, analyze, and apply to roles you have bookmarked for later consideration"
        action={
          <ButtonLink href="/jobs" variant="outline" className="h-9 px-4 font-semibold text-xs border-border/80">
            Explore All Jobs
          </ButtonLink>
        }
      />

      {/* THREE-COLUMN GLASSMORPHIC METRIC CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-border/85 shadow-sm bg-card/60">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <Bookmark className="h-5 w-5 fill-primary/10" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Saved Listings</p>
              <p className="text-xl font-black text-foreground mt-0.5">{metrics.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/85 shadow-sm bg-card/60">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Unique Employers</p>
              <p className="text-xl font-black text-foreground mt-0.5">{metrics.uniqueCompanies}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/85 shadow-sm bg-card/60">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Remote / Hybrid</p>
              <p className="text-xl font-black text-foreground mt-0.5">
                {metrics.remoteCount} <span className="text-xs font-semibold text-muted-foreground">/ {metrics.hybridCount}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved jobs by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border border-border/80 rounded-xl text-xs h-9 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex border rounded-xl overflow-hidden shrink-0 h-9 p-0.5 bg-muted/20 w-full md:w-auto">
            {(['all', 'remote', 'hybrid', 'onsite'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setWorkstyleFilter(style)}
                className={cn(
                  "flex-1 md:flex-none px-3 text-[10px] font-bold rounded-lg transition-all capitalize cursor-pointer",
                  workstyleFilter === style
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {style === 'all' ? 'All Roles' : style}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* JOB LISTING SHEETS */}
      {filteredJobs.length === 0 ? (
        <Card className="border-dashed bg-muted/5">
          <CardContent className="flex flex-col items-center py-14 text-center max-w-sm mx-auto space-y-3">
            <div className="p-3 bg-muted rounded-full text-muted-foreground">
              <Bookmark className="h-7 w-7" />
            </div>
            <p className="font-bold text-foreground text-sm">No saved jobs found</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {savedJobs.length === 0
                ? "Start searching through job listings and save opportunities to track them here."
                : "No saved listings match the query or filters selected."}
            </p>
            <div className="pt-2">
              <ButtonLink href="/jobs" className="h-9 px-4 font-bold text-xs">
                Explore Listings
              </ButtonLink>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3.5">
          <AnimatePresence initial={false}>
            {filteredJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, y: -15, marginBottom: 0, transition: { duration: 0.25 } }}
                className="overflow-hidden"
              >
                <Card className="relative overflow-hidden border-border/80 shadow-sm pl-3.5 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 before:bg-primary transition-all duration-200 hover:shadow-md hover:border-primary/45">
                  <CardContent className="flex flex-col gap-4 p-4.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground text-sm tracking-tight sm:text-base leading-snug truncate">{job.title}</h3>
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
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {job.company}
                      </p>
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

                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        size="sm"
                        onClick={() => openApply(job)}
                        className="h-8 text-[10px] font-black bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
                      >
                        Apply
                      </Button>
                      
                      <ButtonLink href={`/jobs/${job.id}`} size="sm" variant="outline" className="h-8 text-[10px] font-bold border-border/80">
                        View Details
                      </ButtonLink>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isToggling(job.id)}
                        onClick={() => void handleRemove(job)}
                        className="h-8 text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 cursor-pointer"
                      >
                        {isToggling(job.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
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

      <p className="text-[10px] text-muted-foreground font-semibold">
        Need more roles? <Link href="/jobs" className="text-primary underline-offset-4 hover:underline">Browse all vacancies</Link>
      </p>
    </div>
  );
}
