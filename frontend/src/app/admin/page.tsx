'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bookmark,
  Briefcase,
  FileText,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ButtonLink } from '@/components/ui/link-button';
import { adminService } from '@/services/admin.service';
import { useAuthStore } from '@/store/auth.store';
import { formatAdminDate, StageBadge } from '@/components/admin/admin-format';

const PIE_COLORS: Record<string, string> = {
  applied: '#498050',
  screening: '#f59e0b',
  shortlisted: '#8b5cf6',
  interview: '#3b82f6',
  offer: '#10b981',
  rejected: '#ef4444',
  hired: '#06b6d4',
};

export default function CareerTrackAdminPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminService.getOverview,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const adminName = user ? `${user.firstName} ${user.lastName}` : 'Admin';
  const pieData = Object.entries(data.byStage)
    .map(([stage, count]) => ({
      name: stage,
      value: Number(count),
      color: PIE_COLORS[stage] || '#64748b',
    }))
    .filter((item) => item.value > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative space-y-1.5">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-primary uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Career Track administration
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800 md:text-2xl">
            Welcome back, {adminName}
          </h2>
          <p className="max-w-xl text-xs leading-relaxed text-slate-500">
            Review candidates, profiles, applications, saved jobs, and the live job catalog from Career Track.
          </p>
        </div>
        <div className="relative z-10 flex shrink-0 flex-wrap gap-2.5">
          <ButtonLink href="/admin/candidates" size="sm" className="shadow-sm">
            Review candidates <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </ButtonLink>
          <ButtonLink href="/admin/applications" variant="outline" size="sm">
            Open applications
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Candidates" value={data.counts.candidates} icon={Users} description={`${data.counts.activeCandidates} active`} />
        <StatCard title="Profiles" value={data.counts.profiles} icon={UserRound} description={`${data.counts.completedProfiles} complete`} />
        <StatCard title="Applications" value={data.counts.applications} icon={Briefcase} />
        <StatCard title="Saved Jobs" value={data.counts.savedJobs} icon={Bookmark} />
        <StatCard
          title="Jobs"
          value={data.counts.jobs ?? '—'}
          icon={FileText}
          description={data.jobsUnavailable ? 'Catalog unavailable' : 'Talent Desk catalog'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200/80 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Platform activity</CardTitle>
              <CardDescription className="text-[11px] text-slate-400">
                Applications and new candidates over the last six months
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-[10px] font-semibold text-slate-500">
              Career Track data
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminCandidates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100" />
                  <XAxis dataKey="month" className="text-[10px] font-bold text-slate-400" axisLine={false} tickLine={false} />
                  <YAxis className="text-[10px] font-bold text-slate-400" axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" name="Applications" dataKey="applications" stroke="var(--color-primary)" strokeWidth={2} fill="url(#adminApps)" />
                  <Area type="monotone" name="New candidates" dataKey="candidates" stroke="#3b82f6" strokeWidth={2} fill="url(#adminCandidates)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">Pipeline breakdown</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">All candidate applications by stage</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2">
            {pieData.length > 0 ? (
              <>
                <div className="relative flex h-[160px] w-full items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value">
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-extrabold text-slate-800">
                      {pieData.reduce((sum, item) => sum + item.value, 0)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[10px] font-semibold text-slate-600">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="capitalize">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-xs text-slate-500">No applications yet.</p>
            )}
            <ButtonLink href="/admin/applications" variant="ghost" size="sm" className="mt-4 w-full text-xs font-bold text-primary">
              Review applications
            </ButtonLink>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">Recent candidates</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Newest Career Track accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentCandidates.length > 0 ? (
              data.recentCandidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/admin/candidates/${candidate.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50/50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">{candidate.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{formatAdminDate(candidate.createdAt)}</span>
                </Link>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                No candidates yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">Recent applications</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Latest submissions across candidates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentApplications.length > 0 ? (
              data.recentApplications.slice(0, 5).map((application) => (
                <div key={application.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{application.jobTitle}</p>
                      <p className="text-[10px] font-medium text-slate-500">
                        {application.candidateName} · {application.company}
                      </p>
                    </div>
                    <StageBadge stage={application.stage} />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                No applications yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">Latest activity</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">Notifications from candidate accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <p className="text-[10px] text-slate-500">{item.message}</p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    {item.actor ? `${item.actor} · ` : ''}
                    {formatAdminDate(item.at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                No activity yet.
              </p>
            )}
            <ButtonLink href="/admin/activity" variant="ghost" size="sm" className="w-full text-xs font-bold text-primary">
              View all activity
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
