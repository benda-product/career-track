'use client';

import { useState } from 'react';
import { Briefcase, Calendar, Loader2, MapPin, Check, Sparkles, ChevronDown, CheckCircle2, Building, DollarSign } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/link-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecommendedJob } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function formatPostedDate(value?: string) {
  if (!value) return 'Recently posted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently posted';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface RecommendedJobCardProps {
  job: RecommendedJob;
  compact?: boolean;
  onApply?: (job: RecommendedJob) => void;
  isApplying?: boolean;
}

export function RecommendedJobCard({
  job,
  compact = false,
  onApply,
  isApplying = false,
}: RecommendedJobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const jobForSave = {
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    location: job.location,
    salary: job.salary,
    employmentType: job.employmentType,
    remote: job.remote,
  };

  // Determine accent color classes based on match score
  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      border: 'before:bg-emerald-500 border-l-4 border-l-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      stroke: 'stroke-emerald-500',
      bg: 'bg-emerald-500/10'
    };
    if (score >= 60) return {
      border: 'before:bg-amber-500 border-l-4 border-l-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      stroke: 'stroke-amber-500',
      bg: 'bg-amber-500/10'
    };
    return {
      border: 'before:bg-slate-400 border-l-4 border-l-slate-400',
      text: 'text-slate-600 dark:text-slate-400',
      stroke: 'stroke-slate-400',
      bg: 'bg-slate-400/10'
    };
  };

  const scoreStyle = getScoreColor(job.matchScore);

  if (compact) {
    return (
      <Card className={cn(
        "relative overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30",
        scoreStyle.border
      )}>
        <CardContent className="p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground leading-snug">{job.title}</p>
              <p className="truncate text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                <Building className="h-3 w-3 shrink-0" />
                {job.company}
              </p>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-[9px] font-bold py-0 px-1.5 border-0 rounded", scoreStyle.text, scoreStyle.bg)}>
                  {job.matchScore}% Match
                </Badge>
                {job.location && (
                  <span className="truncate text-[9px] text-muted-foreground font-semibold flex items-center gap-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {job.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1 items-center">
              <SaveJobButton job={jobForSave} />
              <ButtonLink href={`/jobs/${job.id}`} variant="ghost" size="sm" className="h-8 font-bold text-[10px] border">
                View
              </ButtonLink>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Radial SVG score math
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference;

  return (
    <Card className={cn(
      "relative overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/45",
      scoreStyle.border
    )}>
      <CardContent className="p-5 space-y-4">
        {/* Header particulars block */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-foreground text-sm tracking-tight sm:text-base leading-snug">{job.title}</h3>
              {job.remote && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">
                  Remote
                </Badge>
              )}
              {job.alreadyApplied && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">
                  Applied
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              {job.company}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-semibold pt-1">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                {formatPostedDate(job.postedAt)}
              </span>
              {job.employmentType && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {job.employmentType}
                </span>
              )}
              {job.salary && (
                <span className="flex items-center gap-0.5">
                  <DollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          {/* Match score gauge ring */}
          <div className="flex sm:flex-col items-center gap-3 self-start sm:self-center shrink-0">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background border shadow-inner">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-muted/20"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className={cn("transition-all duration-500", scoreStyle.stroke)}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black text-foreground">{job.matchScore}%</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase hidden sm:inline">Match Score</span>
          </div>
        </div>

        {/* Dynamic skills highlights comparator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          {/* Matched skills section */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Check className="h-3.5 w-3.5 shrink-0" />
              Matched Skills ({job.matchedSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.matchedSkills.length > 0 ? (
                job.matchedSkills.slice(0, 8).map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-emerald-50/50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 text-[10px] font-bold py-0.5 px-2">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground font-medium italic">No matching skills found.</span>
              )}
              {job.matchedSkills.length > 8 && (
                <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 text-[10px] font-bold py-0.5 px-2">
                  +{job.matchedSkills.length - 8} more
                </Badge>
              )}
            </div>
          </div>

          {/* Missing skills segment */}
          {job.missingSkills && job.missingSkills.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Highlight on Resume ({job.missingSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.missingSkills.slice(0, 8).map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-amber-50/50 text-amber-700 border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 text-[10px] font-bold py-0.5 px-2">
                    {skill}
                  </Badge>
                ))}
                {job.missingSkills.length > 8 && (
                  <Badge variant="outline" className="bg-amber-50/50 text-amber-700 border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 text-[10px] font-bold py-0.5 px-2">
                    +{job.missingSkills.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible description details */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/40 space-y-2 mt-1">
                <h4 className="text-xs font-bold text-foreground">Role Description</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 border border-border/40 p-3 rounded-xl">
                  {job.description || 'No description listed from this recruitment system.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions panel */}
        <div className="flex items-center justify-between gap-4 pt-3.5 border-t">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 font-semibold text-[10px] border gap-1 hover:bg-muted/30"
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <SaveJobButton job={jobForSave} variant="outline" />
            {job.alreadyApplied ? (
              <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold gap-1 border" disabled>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Applied
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onApply?.(job)}
                disabled={isApplying}
                className="h-8 text-[10px] font-black bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
              >
                {isApplying && <Loader2 className="h-3 w-3 animate-spin" />}
                Quick Apply
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendedJobsEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center py-12 text-center max-w-sm mx-auto space-y-3">
        <div className="p-3 bg-muted rounded-full text-muted-foreground">
          <Briefcase className="h-7 w-7" />
        </div>
        <p className="font-bold text-foreground text-sm">No recommended matches yet</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Complete your profile fields and add relevant skill credentials to get personalized AI role suggestions.
        </p>
        <div className="pt-2">
          <ButtonLink href="/profile" className="h-9 px-4 font-bold text-xs">
            Complete Profile
          </ButtonLink>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendedJobsLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground font-semibold">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      Loading matching vacancies...
    </div>
  );
}
