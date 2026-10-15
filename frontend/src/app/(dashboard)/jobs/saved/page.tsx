'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, MapPin, Building, Search } from 'lucide-react';
import { JobBoardCard, JobBoardList } from '@/components/jobs/job-board-card';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { jobsService } from '@/services/jobs.service';
import { normalizeSavedJobs } from '@/utils/jobs';
import { cn } from '@/lib/utils';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { useJobApply } from '@/hooks/use-job-apply';

export default function SavedJobsPage() {
  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [workstyleFilter, setWorkstyleFilter] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');

  const { data: savedJobs = [], isLoading } = useQuery({
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
        <JobBoardList>
          {filteredJobs.map((job) => (
            <JobBoardCard
              key={job.id}
              job={job}
              onApply={openApply}
              note={job.hasApplied ? 'Applied' : undefined}
            />
          ))}
        </JobBoardList>
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
