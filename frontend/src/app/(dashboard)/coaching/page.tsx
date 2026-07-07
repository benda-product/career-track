'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { MessageSquare, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { usePlanEntitlements } from '@/hooks/use-plan-entitlements';
import { coachingService } from '@/services/coaching.service';

export default function CoachingPage() {
  const queryClient = useQueryClient();
  const { data: planEntitlements } = usePlanEntitlements();
  const { data: coaching, isLoading } = useQuery({
    queryKey: ['coaching-entitlements'],
    queryFn: coachingService.getEntitlements,
  });

  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const hasFeature = Boolean(planEntitlements?.featureFlags?.coachingCredits);

  const requestMutation = useMutation({
    mutationFn: coachingService.requestSession,
    onSuccess: () => {
      setTopic('');
      setMessage('');
      setFormError('');
      setSuccessMessage('Your mock interview request was submitted. A career advisor will follow up by email.');
      void queryClient.invalidateQueries({ queryKey: ['coaching-entitlements'] });
      void queryClient.invalidateQueries({ queryKey: ['plan-entitlements'] });
    },
    onError: (err: unknown) => {
      setSuccessMessage('');
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr.response?.data?.message || 'Unable to submit mock interview request.');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Interview"
        description="Use your monthly Career Pro mock interview credit for personalized interview guidance."
      />

      {!hasFeature ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Mock interview is a Career Pro feature</p>
              <p className="text-xs text-muted-foreground">
                Upgrade to get 1 mock interview credit per month for resume strategy, interview prep, and career planning.
              </p>
            </div>
            <Link href="/billing?plan=pro">
              <Button size="sm">Upgrade to Career Pro</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Credits this month
              </p>
              <p className="mt-1 text-2xl font-black text-foreground">
                {isLoading ? '—' : coaching?.creditsRemaining ?? 0}
                <span className="text-sm font-semibold text-muted-foreground">
                  {' '}
                  / {coaching?.creditsAllowance ?? planEntitlements?.coachingCreditsPerMonth ?? 1}
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each credit covers one async mock interview request. Our team reviews your profile and responds with
                actionable feedback within 2 business days.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {hasFeature ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request a mock interview</CardTitle>
            <CardDescription>
              Tell us what you want help with. One credit is used per request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMessage ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMessage}
              </div>
            ) : null}
            {formError ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs text-rose-800">
                {formError}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="coaching-topic">Interview focus</Label>
              <Input
                id="coaching-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Behavioral interview, system design, role-specific prep"
                disabled={requestMutation.isPending || (coaching?.creditsRemaining ?? 0) <= 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coaching-message">What would you like to practice?</Label>
              <Textarea
                id="coaching-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share context about your goals, target roles, and any blockers..."
                disabled={requestMutation.isPending || (coaching?.creditsRemaining ?? 0) <= 0}
              />
            </div>
            <Button
              onClick={() => requestMutation.mutate({ topic, message })}
              disabled={
                requestMutation.isPending ||
                !topic.trim() ||
                !message.trim() ||
                (coaching?.creditsRemaining ?? 0) <= 0
              }
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Submit mock interview request
                </>
              )}
            </Button>
            {(coaching?.creditsRemaining ?? 0) <= 0 ? (
              <p className="text-xs text-muted-foreground">
                No credits remaining this month. Credits renew at the start of your next billing period.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {hasFeature && coaching?.recentRequests?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {coaching.recentRequests.map((item, index) => (
              <div
                key={`${item.topic}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground">{item.topic}</span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
