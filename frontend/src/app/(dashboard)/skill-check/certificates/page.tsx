'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Medal, PlayCircle, RefreshCw, Trophy, ShieldCheck, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { CertificateCard } from '@/components/skill-check/CertificateCard';
import { CertificateVerifyPanel } from '@/components/skill-check/CertificateVerifyPanel';
import { skillCheckService } from '@/services/skillCheck.service';

export default function CertificatesPage() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const { data: certificates, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['skill-check-certificates'],
    queryFn: skillCheckService.getCertificates,
    retry: false,
  });

  const handleSync = useCallback(async () => {
    setSyncError('');
    setSyncing(true);
    try {
      await skillCheckService.refreshFromPlatform();
      await queryClient.invalidateQueries({ queryKey: ['skill-check-certificates'] });
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

  const items = certificates || [];

  const stats = useMemo(() => {
    const total = items.length;
    const withIds = items.filter((item) => item.certificateId).length;
    const skills = new Set(items.map((item) => item.category)).size;
    const average =
      total > 0
        ? Math.round(items.reduce((sum, item) => sum + (item.percentage || 0), 0) / total)
        : 0;
    return { total, withIds, skills, average };
  }, [items]);

  const loadError = syncError || (error as Error | undefined)?.message || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <PageHeader
        title="My Certificates"
        description="View, share, and verify your verified skill credentials. Certificates are issued automatically upon passing hard assessments with 80% or higher."
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
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <>
          {/* Certificates Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Certificates"
              value={stats.total}
              description="Earned assessment badges"
              icon={Medal}
            />
            <StatCard
              title="Verified skills"
              value={stats.skills}
              description="Categories authenticated"
              icon={Trophy}
            />
            <StatCard
              title="Average score"
              value={`${stats.average}%`}
              description="Mean passing percentage"
              icon={Award}
            />
            <StatCard
              title="Certificate IDs"
              value={stats.withIds}
              description="Cryptographic credentials"
              icon={ShieldCheck}
            />
          </div>

          {items.length === 0 ? (
            <Card className="border-border/60 shadow-sm bg-muted/20">
              <CardContent className="py-16 text-center max-w-md mx-auto space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                  <Medal className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">No credentials earned yet</h3>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Complete hard-difficulty level skill assessments with an 80% score or higher to unlock professional certificates.
                  </p>
                </div>
                <LinkButton href="/skill-check/take" size="sm" className="shadow-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                  Start Hard Assessment
                </LinkButton>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">Your Verified Credentials</h2>
              </div>
              <div className="space-y-3">
                {items.map((certificate) => (
                  <CertificateCard key={certificate.bendaTestId} certificate={certificate} />
                ))}
              </div>
            </div>
          )}

          {/* Verification section */}
          <div className="pt-4">
            <CertificateVerifyPanel />
          </div>
        </>
      )}
    </motion.div>
  );
}
