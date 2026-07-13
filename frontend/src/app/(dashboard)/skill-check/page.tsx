'use client';

import { Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardCheck, History, PlayCircle, RefreshCw, Trophy, Target, AlertCircle, Award } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { SkillPerformanceSummary } from '@/components/skill-check/SkillPerformanceSummary';
import { SkillCheckUpgradeBanner } from '@/components/skill-check/SkillCheckUpgradeBanner';
import { TestResultCard } from '@/components/skill-check/TestResultCard';
import { skillCheckService } from '@/services/skillCheck.service';

function SkillCheckPageContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('upgraded') === 'skillcheck') {
      setUpgradeMessage('SkillCheck plan updated. Your entitlements are now active in Career Track.');
      void queryClient.invalidateQueries({ queryKey: ['skill-check-entitlements'] });
    }
  }, [searchParams, queryClient]);

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

  const stats = useMemo(() => {
    const total = history.length;
    const passed = history.filter((t) => t.passed).length;
    const passedRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const average =
      total > 0
        ? Math.round(history.reduce((sum, t) => sum + (t.percentage || 0), 0) / total)
        : 0;
    const verifiedSkills = new Set(
      history.filter((t) => t.passed).map((t) => t.category)
    ).size;
    return { total, passed, passedRate, average, verifiedSkills };
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
        title="View Result"
        description="Verify your tech skills, download verified credentials, and track your assessment records"
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
            <LinkButton href="/skill-check/take" size="sm" className="shadow-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <PlayCircle className="mr-2 h-4 w-4" />
              Take test
            </LinkButton>
          </div>
        }
      />

      <SkillCheckUpgradeBanner />

      {upgradeMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {upgradeMessage}
        </div>
      ) : null}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-red-500" />
          <p>{loadError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : history.length === 0 ? (
        <Card className="border-border/60 shadow-sm bg-muted/20">
          <CardContent className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No assessment results yet</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Take skill assessments to verify and display your core capabilities on your profile.
              </p>
            </div>
            <LinkButton href="/skill-check/take" size="sm" className="shadow-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              Take a test
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats widgets */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total tests"
              value={stats.total}
              description="Completed credentials"
              icon={ClipboardCheck}
            />
            <StatCard
              title="Passed"
              value={stats.passed}
              description={`${stats.passedRate}% passing rate`}
              icon={Trophy}
            />
            <StatCard
              title="Average score"
              value={`${stats.average}%`}
              description="Overall mean percentage"
              icon={Target}
            />
            <StatCard
              title="Verified skills"
              value={stats.verifiedSkills}
              description="Hiring badges unlocked"
              icon={Award}
            />
          </div>

          {/* Proficiency summary component */}
          <SkillPerformanceSummary tests={history} />

          {/* Results cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <h2 className="text-base font-bold tracking-tight text-foreground">Recent Test Results</h2>
              <LinkButton
                href="/skill-check/my-tests"
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-primary hover:text-primary/90 hover:bg-primary/5 flex items-center gap-1.5"
              >
                <History className="h-4 w-4" />
                Full history
              </LinkButton>
            </div>
            <div className="space-y-3">
              {history.map((test) => (
                <TestResultCard key={test.bendaTestId} test={test} />
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function ViewResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SkillCheckPageContent />
    </Suspense>
  );
}
