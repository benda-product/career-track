'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { billingService } from '@/services/billing.service';

export default function BillingSuccessPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'confirming' | 'done'>('confirming');

  useEffect(() => {
    const subscriptionId = searchParams.get('subscription_id');

    if (!subscriptionId) {
      setStatus('done');
      return;
    }

    billingService
      .confirmCheckout(subscriptionId)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] });
        setStatus('done');
      })
      .catch(() => setStatus('done'));
  }, [queryClient, searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardContent className="space-y-4 p-10">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="text-2xl font-bold">
            {status === 'confirming' ? 'Confirming payment…' : 'Payment successful'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your Career Pro subscription is active. Priority insights and advanced analytics are now unlocked.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/dashboard">
              <Button className="w-full">Go to dashboard</Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline" className="w-full">
                View billing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
