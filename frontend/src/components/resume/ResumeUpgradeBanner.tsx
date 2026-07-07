'use client';

import { useState } from 'react';
import { Crown, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resumeService } from '@/services/resume.service';

export function ResumeUpgradeBanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: entitlements, isLoading } = useQuery({
    queryKey: ['resume-entitlements'],
    queryFn: resumeService.getEntitlements,
    staleTime: 60_000,
  });

  const isProOrHigher =
    entitlements?.plan === 'pro' ||
    entitlements?.plan === 'career_plus' ||
    entitlements?.plan === 'premium' ||
    entitlements?.plan === 'enterprise';

  async function handleUpgrade() {
    setError('');
    setLoading(true);
    try {
      await resumeService.openUpgradePlans();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Unable to open Resume AI billing.'
      );
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Resume AI plan…
        </CardContent>
      </Card>
    );
  }

  if (isProOrHigher) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/80">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Crown className="h-4 w-4 text-emerald-700" />
            <CardTitle className="text-base text-emerald-900">
              {entitlements?.planLabel ?? 'Pro'} active
            </CardTitle>
            <Badge variant="secondary" className="bg-white/80">
              Resume AI
            </Badge>
          </div>
          <CardDescription className="text-emerald-800/80">
            {entitlements?.includedViaCareerPro
              ? 'Included in your Career Pro plan — unlimited resumes and premium templates.'
              : entitlements?.plan === 'career_plus' || entitlements?.plan === 'premium'
                ? 'Advanced career tools unlocked on your Resume AI subscription.'
                : 'Unlimited resumes, premium templates, cover letters, and JD matching.'}
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
          <CardTitle className="text-base">Upgrade Resume AI Pro</CardTitle>
          <Badge variant="outline">$12.99/mo</Badge>
        </div>
        <CardDescription>
          You&apos;re on the free plan ({entitlements?.maxResumes ?? 1} resume). Upgrade for
          unlimited versions without changing your Career Track plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>Unlimited resume versions</li>
          <li>Premium templates & cover letters</li>
          <li>JD matching & resume analytics</li>
        </ul>
        <Button onClick={() => void handleUpgrade()} disabled={loading} className="shrink-0">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening…
            </>
          ) : (
            'Upgrade on Resume AI'
          )}
        </Button>
      </CardContent>
      {error ? <CardContent className="pt-0 text-sm text-destructive">{error}</CardContent> : null}
    </Card>
  );
}
