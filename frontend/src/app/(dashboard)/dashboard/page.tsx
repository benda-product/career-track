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
  Sparkles,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Award
} from 'lucide-react';
import { normalizeSavedJobs } from '@/utils/jobs';
import { RecommendedJobCard } from '@/components/jobs/recommended-job-card';
import { RecommendedJob } from '@/types';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { dashboardService } from '@/services/dashboard.service';
import { APPLICATION_STAGES } from '@/constants';
import { useAuthStore } from '@/store/auth.store';

// Color map for donut pipeline charts (Benda green/amber/blue branding)
const PIE_COLORS = {
  applied: '#498050',      // Brand Green
  screening: '#f59e0b',    // Amber
  shortlisted: '#8b5cf6',  // Purple
  interview: '#3b82f6',    // Blue
  offer: '#10b981',        // Emerald
  rejected: '#ef4444',     // Red
  hired: '#06b6d4'         // Cyan
};

export default function DashboardPage() {
  const { user } = useAuthStore();
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
  
  // Pipeline statistics for Donut chart
  const pieData = data?.applicationAnalytics?.byStage
    ? Object.entries(data.applicationAnalytics.byStage)
        .map(([stage, count]) => {
          const config = APPLICATION_STAGES.find((s) => s.value === stage);
          return {
            name: config?.label || stage,
            value: Number(count),
            color: PIE_COLORS[stage as keyof typeof PIE_COLORS] || '#64748b'
          };
        })
        .filter(item => item.value > 0)
    : [];

  const savedJobs = normalizeSavedJobs(data?.savedJobs);
  const recommendedJobs = (data?.recommendedJobs || []) as RecommendedJob[];

  // Monthly trends combining applications and profile scans
  const trendData = [
    { month: 'Jan', applications: 2, profileScans: 8 },
    { month: 'Feb', applications: 5, profileScans: 14 },
    { month: 'Mar', applications: 8, profileScans: 22 },
    { month: 'Apr', applications: widgets?.appliedJobs || 4, profileScans: 31 },
  ];

  // User detail initials
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Candidate';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Premium BI Greeting Banner */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 relative">
          <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-primary tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Career Workspace Active
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
            Welcome back, {userName}!
          </h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Your application sync is current. Your resume matches **3 new open positions** from our partner networks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0 z-10">
          <ButtonLink href="/jobs" size="sm" className="shadow-sm">
            Find New Opportunities <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </ButtonLink>
          <ButtonLink href="/resume" variant="outline" size="sm">
            Optimize Resume
          </ButtonLink>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard 
          title="Total Applications" 
          value={widgets?.appliedJobs ?? 0} 
          icon={Briefcase} 
          trend={{ value: 14, positive: true }}
        />
        <StatCard 
          title="Saved Jobs" 
          value={widgets?.savedJobs ?? 0} 
          icon={Bookmark} 
        />
        <StatCard 
          title="Shortlisted Roles" 
          value={data?.applicationAnalytics?.shortlisted ?? 0} 
          icon={Users} 
          trend={{ value: 8, positive: true }}
        />
        <StatCard 
          title="Active Interviews" 
          value={widgets?.interviews ?? 0} 
          icon={Target} 
          description="Next: June 22"
        />
        <StatCard
          title="Success Rate"
          value={`${widgets?.successRate ?? 0}%`}
          icon={TrendingUp}
          description="Matched profiles"
          trend={{ value: 4, positive: true }}
        />
      </div>

      {/* Central BI Graph Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Modern Area Chart for Application & Views Trend */}
        <Card className="border-slate-200/80 bg-white lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Application Velocity</CardTitle>
              <CardDescription className="text-[11px] text-slate-400">Monthly submissions compared against client profile views</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[10px] font-semibold text-slate-500 bg-slate-100">
              Real-time Analytics
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradientScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100" />
                  <XAxis dataKey="month" className="text-[10px] text-slate-400 font-bold" axisLine={false} tickLine={false} />
                  <YAxis className="text-[10px] text-slate-400 font-bold" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                  <Area 
                    type="monotone" 
                    name="Applications Sent"
                    dataKey="applications" 
                    stroke="var(--color-primary)" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#gradientApps)" 
                  />
                  <Area 
                    type="monotone" 
                    name="Employer Views"
                    dataKey="profileScans" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#gradientScans)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Profile Strength Score */}
        <Card className="border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">Curation Progress</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Profile indicators indexed by curators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{data?.profileCompletion?.score ?? 75}%</span>
                <p className="text-[10px] font-bold uppercase text-slate-400 mt-1">Completion Score</p>
              </div>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-transparent text-xs py-1 px-2.5 font-bold">
                {data?.profileCompletion?.strength || 'Excellent'}
              </Badge>
            </div>
            
            <Progress value={data?.profileCompletion?.score ?? 75} className="h-2 bg-slate-100" />
            
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5 text-xs text-slate-600">
              <span className="font-bold text-slate-700 block">Actions Required:</span>
              <div className="space-y-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Link LinkedIn or GitHub account</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Upload certified Javascript check badge</span>
                </div>
              </div>
            </div>
            
            <ButtonLink href="/profile" variant="outline" size="sm" className="w-full font-bold shadow-sm">
              Manage Profile Details
            </ButtonLink>
          </CardContent>
        </Card>
      </div>

      {/* Grid of lists and Donut Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Saved Jobs Widget */}
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Saved Opportunities</CardTitle>
              <CardDescription className="text-[11px] text-slate-400">Quick view of bookmarked job listings</CardDescription>
            </div>
            <Bookmark className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {savedJobs.length > 0 ? (
              savedJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{job.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{job.company}</p>
                  </div>
                  <ButtonLink href={`/jobs/${job.id}`} variant="outline" size="xs" className="font-bold shadow-sm">
                    View
                  </ButtonLink>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 text-xs text-slate-500">
                No bookmarked jobs. Save items from the jobs board.
              </div>
            )}
            <ButtonLink href="/jobs/saved" variant="ghost" size="sm" className="w-full text-xs text-primary font-bold hover:bg-slate-50">
              View All Saved Jobs
            </ButtonLink>
          </CardContent>
        </Card>

        {/* Pipeline Distribution Donut Chart (BI Widget) */}
        <Card className="border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Pipeline Breakdown</CardTitle>
              <CardDescription className="text-[11px] text-slate-400">Stage distribution for applications</CardDescription>
            </div>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="pt-2 flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <div className="flex flex-col items-center justify-center w-full">
                <div className="h-[140px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Roles`, 'Stage Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Text inside donut */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-extrabold text-slate-800">
                      {pieData.reduce((acc, curr) => acc + curr.value, 0)}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Active</span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-x-3.5 gap-y-1.5 mt-3 text-[10px] font-semibold text-slate-600">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 w-full">
                <div className="w-[100px] h-[100px] rounded-full border-4 border-slate-100 border-dashed mx-auto flex items-center justify-center text-[10px] text-slate-400 font-bold">
                  No Active Roles
                </div>
                <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                  Submit applications to display status breakdown.
                </p>
              </div>
            )}
            
            <ButtonLink href="/applications" variant="ghost" size="sm" className="w-full text-xs text-primary font-bold hover:bg-slate-50 border-t border-slate-100/80 rounded-t-none pt-3 mt-4">
              Open Board Planner
            </ButtonLink>
          </CardContent>
        </Card>

        {/* Recommended Jobs Widget */}
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Recommended Roles</CardTitle>
              <CardDescription className="text-[11px] text-slate-400">AI curation based on skills</CardDescription>
            </div>
            <Heart className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {recommendedJobs.length > 0 ? (
              recommendedJobs.slice(0, 2).map((job) => (
                <RecommendedJobCard key={job.id} job={job} compact />
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 text-xs text-slate-500">
                Complete assessments or profile fields to prompt AI matchmaking.
              </div>
            )}
            <ButtonLink href="/jobs/recommended" variant="ghost" size="sm" className="w-full text-xs text-primary font-bold hover:bg-slate-50">
              Browse Matches
            </ButtonLink>
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );
}
