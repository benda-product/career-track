'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  PlayCircle,
  RefreshCw,
  Trophy,
  Search,
  X,
  TrendingUp,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestHistoryList } from '@/components/skill-check/TestHistoryList';
import { skillCheckService } from '@/services/skillCheck.service';
import { formatCategory } from '@/components/skill-check/test-result-utils';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function MyTestsPage() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const { data: tests, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['skill-check-history'],
    queryFn: skillCheckService.getHistory,
    retry: false,
  });

  const handleSync = useCallback(async () => {
    setSyncError('');
    setSyncing(true);
    try {
      await skillCheckService.refreshFromPlatform();
      await queryClient.invalidateQueries({ queryKey: ['skill-check-history'] });
      await refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setSyncError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to sync from Benda Test Platform'
      );
    } finally {
      setSyncing(false);
    }
  }, [queryClient, refetch]);

  const history = tests || [];

  // Filter assessments list based on search and tab selections
  const filteredHistory = useMemo(() => {
    return history.filter((test) => {
      const categoryLabel = formatCategory(test.category || '');
      const matchesSearch = categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'passed'
            ? test.passed
            : !test.passed;
      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  // Aggregate dashboard stats metrics
  const stats = useMemo(() => {
    const total = history.length;
    const passed = history.filter((t) => t.passed).length;
    const passedRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const average =
      total > 0
        ? Math.round(history.reduce((sum, t) => sum + (t.percentage || 0), 0) / total)
        : 0;
    return { total, passed, passedRate, average };
  }, [history]);

  // Generate data points for Recharts area graph
  const chartData = useMemo(() => {
    return [...history]
      .filter((t) => t.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
      .map((t) => ({
        date: new Date(t.completedAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: t.percentage,
        category: formatCategory(t.category)
      }));
  }, [history]);

  const loadError = syncError || (error as Error | undefined)?.message || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <PageHeader
        title="Test History"
        description="Review assessment scores and track certificate eligibility synced with the Benda platform"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSync()}
              disabled={syncing || isFetching}
              className="border-border/80 text-foreground hover:bg-muted/30"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing || isFetching ? 'animate-spin' : ''}`} />
              Sync results
            </Button>
            <ButtonLink href="/skill-check/take" size="sm" className="shadow-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <PlayCircle className="mr-2 h-4 w-4" />
              Take test
            </ButtonLink>
          </div>
        }
      />

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-red-500" />
          <p>{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <>
          {/* Dashboard Stats Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Total assessments"
              value={stats.total}
              description="Completed skill credentials"
              icon={ClipboardCheck}
            />
            <StatCard
              title="Passed"
              value={stats.passed}
              description={`${stats.passedRate}% pass rate`}
              icon={Trophy}
            />
            <StatCard
              title="Average score"
              value={`${stats.average}%`}
              description="Mean score percentage"
              icon={Target}
            />
          </div>

          {/* Performance Area Progress Graph */}
          {chartData.length >= 2 && (
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-4.5 w-4.5 text-primary" />
                  Score Progression Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pl-0 pb-1">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="progressionScoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.54 0.14 142)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="oklch(0.54 0.14 142)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                      <XAxis
                        dataKey="date"
                        className="text-[10px] text-muted-foreground font-semibold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        className="text-[10px] text-muted-foreground font-semibold"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload as { category: string; score: number; date: string };
                            return (
                              <div className="rounded-xl border border-border/80 bg-background p-3 shadow-md text-xs space-y-1">
                                <p className="font-bold text-foreground">{p.category}</p>
                                <p className="text-muted-foreground">Date: {p.date}</p>
                                <div className="flex items-center gap-1.5 font-bold text-primary pt-0.5 border-t">
                                  <Award className="h-3.5 w-3.5" />
                                  <span>Score: {p.score}%</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="oklch(0.54 0.14 142)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#progressionScoreColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toolbar Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-2">
            {/* Search Input bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assessments by skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm w-full bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle Group */}
            <div className="flex items-center p-1 bg-muted rounded-xl w-fit border border-border/50">
              {(['all', 'passed', 'failed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    "text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-all duration-200 uppercase tracking-wider cursor-pointer",
                    statusFilter === filter
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter === 'all' ? 'All' : filter === 'passed' ? 'Passed' : 'Not Passed'}
                </button>
              ))}
            </div>
          </div>

          {/* Test History List Component */}
          <TestHistoryList tests={filteredHistory} />
        </>
      )}
    </motion.div>
  );
}
