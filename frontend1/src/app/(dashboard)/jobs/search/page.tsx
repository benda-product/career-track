'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ButtonLink } from '@/components/ui/link-button';
import { jobsService } from '@/services/jobs.service';
import { EMPLOYMENT_TYPES } from '@/constants';
import { normalizeJobsPayload } from '@/utils/jobs';
import { Job } from '@/types';

export default function JobSearchPage() {
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    skills: '',
    experience: '',
    salaryMin: '',
    salaryMax: '',
    employmentType: '',
    remote: false,
    hybrid: false,
    industry: '',
  });

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['jobs-search', filters],
    queryFn: () =>
      jobsService.searchJobs({
        query: filters.query || undefined,
        location: filters.location || undefined,
        skills: filters.skills || undefined,
        experience: filters.experience || undefined,
        salaryMin: filters.salaryMin ? Number(filters.salaryMin) : undefined,
        salaryMax: filters.salaryMax ? Number(filters.salaryMax) : undefined,
        employmentType: filters.employmentType || undefined,
        remote: filters.remote || undefined,
        hybrid: filters.hybrid || undefined,
        industry: filters.industry || undefined,
      }),
    enabled: false,
    retry: false,
  });

  const jobs: Job[] = normalizeJobsPayload(data?.data);

  return (
    <div className="space-y-6">
      <PageHeader title="Advanced Job Search" description="Filter jobs by skills, salary, location, and more" />

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label>Keywords</Label>
            <Input
              placeholder="Job title, company, keywords..."
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Skills</Label>
            <Input
              placeholder="React, Node.js..."
              value={filters.skills}
              onChange={(e) => setFilters((f) => ({ ...f, skills: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Experience</Label>
            <Select
              value={filters.experience}
              onValueChange={(v) => setFilters((f) => ({ ...f, experience: v || '' }))}
            >
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {['Entry', 'Mid', 'Senior', 'Lead', 'Executive'].map((e) => (
                  <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Min Salary</Label>
            <Input type="number" value={filters.salaryMin} onChange={(e) => setFilters((f) => ({ ...f, salaryMin: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Max Salary</Label>
            <Input type="number" value={filters.salaryMax} onChange={(e) => setFilters((f) => ({ ...f, salaryMax: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Employment Type</Label>
            <Select
              value={filters.employmentType}
              onValueChange={(v) => setFilters((f) => ({ ...f, employmentType: v || '' }))}
            >
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={filters.industry} onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))} />
          </div>
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={filters.remote} onCheckedChange={(c) => setFilters((f) => ({ ...f, remote: !!c }))} />
              Remote
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={filters.hybrid} onCheckedChange={(c) => setFilters((f) => ({ ...f, hybrid: !!c }))} />
              Hybrid
            </label>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button onClick={() => refetch()} disabled={isFetching}>
              <Search className="mr-2 h-4 w-4" />
              {isFetching ? 'Searching...' : 'Search Jobs'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <Card key={job.id || i}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                </div>
                <ButtonLink href={`/jobs/${job.id || i}`} size="sm">View</ButtonLink>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
