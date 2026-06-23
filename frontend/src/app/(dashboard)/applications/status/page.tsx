'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Building, Calendar, Kanban, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { applicationsService } from '@/services/applications.service';
import { APPLICATION_STAGES } from '@/constants';
import type { Application, ApplicationStage } from '@/types';
import { getApplicationStageStyles } from '@/lib/application-status';
import { cn } from '@/lib/utils';

export default function ApplicationStatusPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStage | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsService.getApplications(1, 100),
    retry: false,
  });

  const rawApplications = (data?.data as Application[]) || [];

  const applications = useMemo(() => {
    return rawApplications.filter((app) => {
      const title = app.jobTitle || '';
      const company = app.company || '';
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.stage === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rawApplications, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    return APPLICATION_STAGES.reduce(
      (acc, stage) => {
        acc[stage.value] = rawApplications.filter((app) => app.stage === stage.value).length;
        return acc;
      },
      {} as Record<ApplicationStage, number>
    );
  }, [rawApplications]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Status"
        description="See where each of your job applications stands in the recruitment process"
        action={
          <ButtonLink href="/applications" variant="outline" size="sm">
            <Kanban className="mr-2 h-4 w-4" />
            Open job tracker
          </ButtonLink>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {APPLICATION_STAGES.map((stage) => {
              const style = getApplicationStageStyles(stage.value);
              const count = statusCounts[stage.value] || 0;
              const active = statusFilter === stage.value;

              return (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() => setStatusFilter(active ? 'all' : stage.value)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    active
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/70 bg-card hover:border-primary/30'
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', style.dot)} />
                    <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {statusFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear status filter
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total applications" value={rawApplications.length} icon={Building} />
            <StatCard
              title="In progress"
              value={
                rawApplications.filter((app) =>
                  ['applied', 'screening', 'shortlisted', 'interview'].includes(app.stage)
                ).length
              }
              icon={Calendar}
            />
            <StatCard
              title="Offers & hired"
              value={
                rawApplications.filter((app) => ['offer', 'hired'].includes(app.stage)).length
              }
              icon={Kanban}
            />
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm font-medium text-foreground">No applications found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rawApplications.length === 0
                    ? 'Apply to jobs to track your application status here.'
                    : 'Try a different search or status filter.'}
                </p>
                <ButtonLink href="/jobs" size="sm" className="mt-4">
                  Browse jobs
                </ButtonLink>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const style = getApplicationStageStyles(app.stage);
                const stageLabel =
                  APPLICATION_STAGES.find((s) => s.value === app.stage)?.label || app.stage;

                return (
                  <Card
                    key={app._id}
                    className={cn(
                      'relative overflow-hidden border-border/80 pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1',
                      style.border
                    )}
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <Link
                          href={`/jobs/${app.jobId}`}
                          className="text-sm font-bold text-foreground hover:text-primary"
                        >
                          {app.jobTitle}
                        </Link>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building className="h-3.5 w-3.5" />
                          {app.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Applied {format(new Date(app.appliedAt), 'MMM d, yyyy')}
                          {app.timeline?.length
                            ? ` · Last update ${format(
                                new Date(app.timeline[app.timeline.length - 1].date),
                                'MMM d, yyyy'
                              )}`
                            : ''}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          'w-fit shrink-0 text-[10px] font-bold uppercase tracking-wider',
                          style.badge
                        )}
                      >
                        {stageLabel}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
