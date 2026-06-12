'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bookmark,
  Briefcase,
  FileText,
  Heart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { normalizeSavedJobs } from '@/utils/jobs';
import { RecommendedJobCard } from '@/components/jobs/recommended-job-card';
import { RecommendedJob } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { dashboardService } from '@/services/dashboard.service';
import { APPLICATION_STAGES } from '@/constants';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const widgets = data?.widgets;
  const chartData = data?.applicationAnalytics?.byStage
    ? Object.entries(data.applicationAnalytics.byStage).map(([stage, count]) => ({
        stage: APPLICATION_STAGES.find((s) => s.value === stage)?.label || stage,
        count,
      }))
    : [];

  const savedJobs = normalizeSavedJobs(data?.savedJobs);
  const recommendedJobs = (data?.recommendedJobs || []) as RecommendedJob[];

  const trendData = [
    { month: 'Jan', applications: 2 },
    { month: 'Feb', applications: 5 },
    { month: 'Mar', applications: 8 },
    { month: 'Apr', applications: widgets?.appliedJobs || 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your career progress."
        action={
          <ButtonLink href="/jobs">Browse Jobs</ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Applications" value={widgets?.appliedJobs ?? 0} icon={Briefcase} />
        <StatCard title="Saved Jobs" value={widgets?.savedJobs ?? 0} icon={Bookmark} />
        <StatCard title="Shortlisted" value={data?.applicationAnalytics?.shortlisted ?? 0} icon={Users} />
        <StatCard title="Interviews" value={widgets?.interviews ?? 0} icon={Target} />
        <StatCard
          title="Success Rate"
          value={`${widgets?.successRate ?? 0}%`}
          icon={TrendingUp}
          description="Applications to offers"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/40 bg-card/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Application Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Profile Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{data?.profileCompletion?.score ?? 0}%</span>
              <Badge variant="secondary">{data?.profileCompletion?.strength}</Badge>
            </div>
            <Progress value={data?.profileCompletion?.score ?? 0} className="h-2" />
            {data?.profileCompletion?.missing?.length ? (
              <p className="text-xs text-muted-foreground">
                Missing: {data.profileCompletion.missing.join(', ')}
              </p>
            ) : null}
            <ButtonLink href="/profile" variant="outline" size="sm" className="w-full">
              Complete Profile
            </ButtonLink>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Saved Jobs</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {savedJobs.length > 0 ? (
              savedJobs.slice(0, 4).map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company}</p>
                  </div>
                  <ButtonLink href={`/jobs/${job.id}`} variant="ghost" size="sm">View</ButtonLink>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Save jobs while browsing to see them here.</p>
            )}
            <ButtonLink href="/jobs/saved" variant="outline" size="sm" className="w-full">
              View All Saved Jobs
            </ButtonLink>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pipeline Overview</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="stage" className="text-xs" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recommended Jobs</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedJobs.length > 0 ? (
              recommendedJobs.slice(0, 3).map((job) => (
                <RecommendedJobCard key={job.id} job={job} compact />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete your profile and add skills to get personalized recommendations.
              </p>
            )}
            <ButtonLink href="/jobs/recommended" variant="outline" size="sm" className="w-full">
              View All Recommended Jobs
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
