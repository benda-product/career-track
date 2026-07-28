'use client';

import { Suspense, useEffect, useState } from 'react';
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
import { billingService, type CheckoutResult } from '@/services/billing.service';
import { cn } from '@/lib/utils';
import { isAxiosError } from 'axios';
import { PayPalCheckout } from '@/components/billing/paypal-checkout';
import { BillingInvoices } from '@/components/billing/billing-invoices';

function BillingPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: entitlements, isLoading } = usePlanEntitlements();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [sdkCheckout, setSdkCheckout] = useState<CheckoutResult | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [invoiceRefreshKey, setInvoiceRefreshKey] = useState(0);

  async function handleCancel() {
    const confirmed = window.confirm(
      'Cancel Career Pro? You will keep access until the end of your current billing period and will not be charged again. Resume AI Pro and SkillCheck Pro stay active until then.'
    );
    if (!confirmed) return;
    setError('');
    setMessage('');
    setCancelling(true);
    try {
      const result = await billingService.cancelSubscription();
      setMessage(result.message || 'Subscription cancelled.');
      await queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] });
      await queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message || 'Unable to cancel subscription.'
          : 'Unable to cancel subscription.'
      );
    } finally {
      setCancelling(false);
    }
  }

  async function handleUpgrade(planKey: string, cycle: 'monthly' | 'annual' = billingCycle) {
    if (planKey === 'free') return;
    setError('');
    setMessage('');
    setSdkCheckout(null);
    setLoadingPlan(planKey);
    try {
      const result = await billingService.startCheckout(planKey, cycle);
      if (result.checkoutMode === 'paypal_sdk' || result.checkoutMode === 'paypal_sdk_order') {
        setSdkCheckout(result);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      if (result.activated) {
        setMessage(result.message || `${result.planLabel ?? planKey} plan activated.`);
        await queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] });
        await queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
        setInvoiceRefreshKey((k) => k + 1);
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

  async function handlePayPalSuccess(id: string) {
    setConfirmingPayment(true);
    setError('');
    try {
      await billingService.confirmCheckout(id);
      setSdkCheckout(null);
      setMessage('Career Pro activated successfully.');
      await queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] });
      await queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      setInvoiceRefreshKey((k) => k + 1);
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message || 'Payment completed but activation failed.'
          : 'Payment completed but activation failed.'
      );
    } finally {
      setConfirmingPayment(false);
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

      {entitlements?.devMode ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo billing mode — upgrades and cancellations apply instantly without PayPal.
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

      {sdkCheckout?.paypalClientId ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Complete your upgrade</CardTitle>
            <CardDescription>
              Choose PayPal or pay with a debit/credit card. Sandbox test cards work in this environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PayPalCheckout
              busy={confirmingPayment}
              clientId={sdkCheckout.paypalClientId}
              mode={sdkCheckout.checkoutMode === 'paypal_sdk_order' ? 'order' : 'subscription'}
              planId={sdkCheckout.paypalPlanId}
              customId={sdkCheckout.customId}
              orderAmount={sdkCheckout.orderAmount}
              orderDescription={sdkCheckout.orderDescription}
              onSuccess={handlePayPalSuccess}
              onError={setError}
            />
            <Button variant="outline" size="sm" disabled={confirmingPayment} onClick={() => setSdkCheckout(null)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : null}

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
            {entitlements?.plan === 'pro' && !entitlements?.subscriptionCancelAtPeriodEnd ? (
              <Button
                variant="outline"
                className="border-red-400/40 bg-transparent text-red-200 hover:bg-red-500/10 hover:text-red-100"
                disabled={cancelling}
                onClick={() => void handleCancel()}
              >
                {cancelling ? 'Cancelling…' : 'Cancel subscription'}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {entitlements?.plan === 'pro' && entitlements?.subscriptionCancelAtPeriodEnd && entitlements?.subscriptionCurrentPeriodEnd ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Cancellation scheduled — you keep Career Pro until{' '}
          {new Date(entitlements.subscriptionCurrentPeriodEnd).toLocaleDateString()}. No further charges after that.
        </p>
      ) : entitlements?.plan === 'pro' && entitlements?.subscriptionCurrentPeriodEnd ? (
        <p className="text-xs text-muted-foreground">
          Your plan renews on{' '}
          {new Date(entitlements.subscriptionCurrentPeriodEnd).toLocaleDateString()}. If you cancel, you keep Career Pro
          until that date and will not be charged again.
        </p>
      ) : null}

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

      <BillingInvoices refreshKey={invoiceRefreshKey} />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
