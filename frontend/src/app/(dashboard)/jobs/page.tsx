'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MapPin, ExternalLink } from 'lucide-react';
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

export default function JobsPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', query, location, employmentType],
    queryFn: () => jobsService.searchJobs({ query, location, employmentType }),
    retry: false,
  });

  const jobs: Job[] = normalizeJobsPayload(data?.data);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Discover opportunities from our ATS integration"
        action={
          <div className="flex gap-2">
            <ButtonLink href="/jobs/saved" variant="outline">Saved Jobs</ButtonLink>
            <ButtonLink href="/jobs/search" variant="outline">Advanced Search</ButtonLink>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search jobs..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1" />
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="sm:w-40" />
        <Select value={employmentType} onValueChange={(v) => setEmploymentType(v || '')}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => refetch()}>Search</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No jobs found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <Card key={job.id || i} className="border-border/40 bg-card/50 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{job.title || 'Job Title'}</h3>
                    {job.remote && <Badge variant="secondary">Remote</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                    {job.salary && <span>{job.salary}</span>}
                    {job.employmentType && <span>{job.employmentType}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <SaveJobButton job={{ ...job, id: job.id || String(i) }} />
                  <ButtonLink href={`/jobs/${job.id || i}`} size="sm">
                    <ExternalLink className="mr-1 h-4 w-4" />View
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
