'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Kanban, List } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { applicationsService } from '@/services/applications.service';
import { APPLICATION_STAGES } from '@/constants';
import { Application, ApplicationStage } from '@/types';
import { cn } from '@/lib/utils';

export default function ApplicationsPage() {
  const [view, setView] = useState<'kanban' | 'timeline'>('kanban');
  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsService.getApplications(1, 50),
    retry: false,
  });

  const applications = (data?.data as Application[]) || [];

  const grouped = APPLICATION_STAGES.reduce((acc, stage) => {
    acc[stage.value] = applications.filter((a) => a.stage === stage.value);
    return acc;
  }, {} as Record<ApplicationStage, Application[]>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Track your job applications pipeline"
        action={
          <div className="flex gap-2">
            <Button variant={view === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setView('kanban')}>
              <Kanban className="mr-1 h-4 w-4" />Kanban
            </Button>
            <Button variant={view === 'timeline' ? 'default' : 'outline'} size="sm" onClick={() => setView('timeline')}>
              <List className="mr-1 h-4 w-4" />Timeline
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STAGES.map((stage) => (
            <div key={stage.value} className="min-w-[260px] flex-shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', stage.color)} />
                <h3 className="text-sm font-medium">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto">{grouped[stage.value]?.length || 0}</Badge>
              </div>
              <div className="space-y-2">
                {grouped[stage.value]?.map((app) => (
                  <Card key={app._id} className="border-border/40 bg-card/50">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">{app.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{app.company}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(app.appliedAt), 'MMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {APPLICATION_STAGES.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>{s.label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="all" className="mt-4 space-y-3">
            {applications.map((app) => (
              <Card key={app._id} className="border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{app.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                    </div>
                    <Badge>{APPLICATION_STAGES.find((s) => s.value === app.stage)?.label}</Badge>
                  </div>
                  {app.timeline?.length > 0 && (
                    <div className="mt-4 border-l-2 border-border pl-4 space-y-2">
                      {app.timeline.map((t, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium capitalize">{t.stage}</span>
                          <span className="text-muted-foreground"> · {format(new Date(t.date), 'MMM d')}</span>
                          {t.note && <p className="text-muted-foreground">{t.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
