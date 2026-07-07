'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Crown, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PLAN_CATALOG } from '@/config/plans';
import { usePlanEntitlements } from '@/hooks/use-plan-entitlements';
import { billingService } from '@/services/billing.service';
import { cn } from '@/lib/utils';
import { isAxiosError } from 'axios';

export default function BillingPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: entitlements, isLoading } = usePlanEntitlements();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleUpgrade(planKey: string, cycle: 'monthly' | 'annual' = billingCycle) {
    if (planKey === 'free') return;
    setError('');
    setMessage('');
    setLoadingPlan(planKey);
    try {
      const result = await billingService.startCheckout(planKey, cycle);
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      if (result.activated) {
        setMessage(result.message || `${result.planLabel ?? planKey} plan activated.`);
        await queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] });
        return;
      }
      setMessage('Checkout started.');
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message || 'Unable to upgrade plan.'
          : 'Unable to upgrade plan.'
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    if (!planFromUrl || isLoading || loadingPlan) return;
    if (planFromUrl === entitlements?.plan) return;
    const cycle = searchParams.get('billing') === 'annual' ? 'annual' : 'monthly';
    void handleUpgrade(planFromUrl, cycle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, entitlements?.plan]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const currentPlan = entitlements?.planLabel ?? 'Free';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & plans"
        description="Career Pro includes Resume AI Pro and SkillCheck Pro — one plan for your full job search toolkit."
      />

      {entitlements?.paypalEnabled ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          PayPal checkout is enabled — upgrades redirect to secure PayPal payment.
        </p>
      ) : entitlements?.devMode ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo billing mode — upgrades apply instantly without payment. Add PayPal credentials to enable live checkout.
        </p>
      ) : null}

      {entitlements?.plan === 'pro' && entitlements?.includedProducts ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Included in your Career Pro plan</CardTitle>
            <CardDescription>
              Resume and skill assessments are unlocked at Pro tier — no separate subscription needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {entitlements.includedProducts.resumeAi ? (
              <Badge variant="secondary">{entitlements.includedProducts.resumeAi.label}</Badge>
            ) : null}
            {entitlements.includedProducts.skillCheck ? (
              <Badge variant="secondary">{entitlements.includedProducts.skillCheck.label}</Badge>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card className="border-slate-900 bg-slate-900 text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <p className="font-bold">{currentPlan} plan</p>
            </div>
            <p className="mt-2 text-sm text-white/60">
              {entitlements?.maxRecommendedJobs ?? 20} recommended job matches
              {entitlements?.coachingCreditsPerMonth
                ? ` · ${entitlements.coachingCreditsRemaining ?? entitlements.coachingCreditsPerMonth} mock interview credit(s) left`
                : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/jobs/recommended">
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Sparkles className="mr-2 h-4 w-4" />
                Recommended jobs
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          variant={billingCycle === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingCycle === 'annual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBillingCycle('annual')}
        >
          Annual (20% off)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLAN_CATALOG.map((plan) => {
          const isCurrent = entitlements?.plan === plan.key;
          const annualPrice = (plan.priceMonthly * 12 * 0.8).toFixed(2);
          const displayPrice =
            plan.priceMonthly === 0
              ? '$0'
              : billingCycle === 'annual'
                ? `$${annualPrice} / year`
                : `$${plan.priceMonthly} / month`;

          return (
            <Card
              key={plan.key}
              className={cn(plan.featured && 'border-primary shadow-md ring-1 ring-primary/20')}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{plan.label}</CardTitle>
                    <CardDescription className="mt-1">{plan.subtitle}</CardDescription>
                  </div>
                  {plan.featured ? <Badge>Popular</Badge> : null}
                </div>
                <p className="text-2xl font-bold text-slate-900">{displayPrice}</p>
                <p className="text-xs text-muted-foreground">{plan.tag}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : plan.featured ? 'default' : 'secondary'}
                  disabled={isCurrent || plan.key === 'free' || loadingPlan != null}
                  onClick={() => void handleUpgrade(plan.key, billingCycle)}
                >
                  {loadingPlan === plan.key
                    ? 'Processing…'
                    : isCurrent
                      ? 'Current plan'
                      : plan.key === 'free'
                        ? 'Included'
                        : `Upgrade to ${plan.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
