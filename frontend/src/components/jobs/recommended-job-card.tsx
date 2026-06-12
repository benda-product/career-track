'use client';

import { Briefcase, Calendar, Loader2, MapPin } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RecommendedJob } from '@/types';

function formatPostedDate(value?: string) {
  if (!value) return 'Recently posted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently posted';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface RecommendedJobCardProps {
  job: RecommendedJob;
  compact?: boolean;
}

export function RecommendedJobCard({ job, compact = false }: RecommendedJobCardProps) {
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

  if (compact) {
    return (
      <div className="rounded-lg border border-border/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{job.title}</p>
            <p className="truncate text-xs text-muted-foreground">{job.company}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">{job.matchScore}% match</Badge>
              {job.location && (
                <span className="truncate text-xs text-muted-foreground">{job.location}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <SaveJobButton job={jobForSave} />
            <ButtonLink href={`/jobs/${job.id}`} variant="ghost" size="sm">
              View
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/40 bg-card/50 transition-shadow hover:shadow-md">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{job.title}</h3>
              {job.remote && <Badge variant="secondary">Remote</Badge>}
              {job.alreadyApplied && <Badge variant="outline">Applied</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{job.company}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatPostedDate(job.postedAt)}
              </span>
              {job.employmentType && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.employmentType}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <SaveJobButton job={jobForSave} variant="outline" />
            <ButtonLink href={`/jobs/${job.id}`} size="sm">
              Apply
            </ButtonLink>
            <ButtonLink href={`/jobs/${job.id}`} size="sm" variant="outline">
              Details
            </ButtonLink>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Match score</span>
            <span className="text-muted-foreground">{job.matchScore}%</span>
          </div>
          <Progress value={job.matchScore} className="h-2" />
        </div>

        {job.matchedSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Matched skills</p>
            <div className="flex flex-wrap gap-2">
              {job.matchedSkills.slice(0, 8).map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
              {job.matchedSkills.length > 8 && (
                <Badge variant="outline">+{job.matchedSkills.length - 8} more</Badge>
              )}
            </div>
          </div>
        )}

        {job.missingSkills && job.missingSkills.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Consider highlighting: {job.missingSkills.slice(0, 4).join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendedJobsEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="font-medium">No recommendations yet</p>
        <p className="mb-4 text-sm text-muted-foreground">
          Complete your profile and add skills to get personalized job matches.
        </p>
        <ButtonLink href="/profile">Complete Profile</ButtonLink>
      </CardContent>
    </Card>
  );
}

export function RecommendedJobsLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading recommended jobs...
    </div>
  );
}
