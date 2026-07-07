'use client';

import { useState } from 'react';
import { Crown, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { skillCheckService } from '@/services/skillCheck.service';

export function SkillCheckUpgradeBanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: entitlements, isLoading } = useQuery({
    queryKey: ['skill-check-entitlements'],
    queryFn: skillCheckService.getEntitlements,
    staleTime: 60_000,
  });

  const isPro = entitlements?.planType === 'pro';

  async function handleUpgrade() {
    setError('');
    setLoading(true);
    try {
      await skillCheckService.openUpgradePlans();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Unable to open SkillCheck billing.'
      );
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading SkillCheck plan…
        </CardContent>
      </Card>
    );
  }

  if (isPro) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/80">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Crown className="h-4 w-4 text-emerald-700" />
            <CardTitle className="text-base text-emerald-900">SkillCheck Pro active</CardTitle>
            <Badge variant="secondary" className="bg-white/80">
              {entitlements?.planLabel ?? 'Pro'}
            </Badge>
          </div>
          <CardDescription className="text-emerald-800/80">
            {entitlements?.includedViaCareerPro
              ? 'Included in your Career Pro plan — unlimited retakes and verified badges.'
              : 'Unlimited retakes, verified badges, and priority recruiter visibility.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Upgrade SkillCheck Pro</CardTitle>
          <Badge variant="outline">$19.99/mo</Badge>
        </div>
        <CardDescription>
          You&apos;re on the free plan ({entitlements?.attemptsPerLevel ?? 2} attempts per skill
          level per month). Upgrade for unlimited retakes without changing your Career Track plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>Unlimited test retakes</li>
          <li>Verified skill badges</li>
          <li>Priority visibility to recruiters</li>
        </ul>
        <Button onClick={() => void handleUpgrade()} disabled={loading} className="shrink-0">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening…
            </>
          ) : (
            'Upgrade on SkillCheck'
          )}
        </Button>
      </CardContent>
      {error ? <CardContent className="pt-0 text-sm text-destructive">{error}</CardContent> : null}
    </Card>
  );
}
