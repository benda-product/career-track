'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeService } from '@/services/resume.service';

function ResumeScoreContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['resume-score', id],
    queryFn: () => resumeService.getScore(id),
    enabled: !!id,
    retry: false,
  });

  if (!id) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Select a resume from the Resume page to view its ATS score.
      </div>
    );
  }

  if (isLoading) return <Skeleton className="h-64" />;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {(error as Error).message || 'Failed to load ATS score'}
      </div>
    );
  }

  const score = data?.score ?? 0;
  const suggestions = data?.suggestions || data?.improvements || [];

  return (
    <>
      <Card className="text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">{score}</span>
          </div>
          <p className="text-lg font-semibold">ATS Compatibility Score</p>
          {data?.grade && (
            <p className="mt-1 text-sm text-muted-foreground">Grade: {data.grade}</p>
          )}
          <Progress value={score} className="mx-auto mt-4 max-w-xs" />
        </CardContent>
      </Card>

      {data?.strengths && data.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Strengths</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.strengths.map((item, index) => (
              <p key={index} className="text-sm text-muted-foreground">• {item}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Improvement Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm">{suggestion}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Your resume looks strong for ATS parsing.</p>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() =>
          resumeService.openInResumeBuilder({
            type: 'edit',
            resumeId: id,
            returnUrl: `${window.location.origin}/resume/score?id=${id}`,
          })
        }
      >
        Improve in Resume Builder
      </Button>
    </>
  );
}

export default function ResumeScorePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="ATS Resume Score" description="Score from Resume Builder ATS analysis" />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ResumeScoreContent />
      </Suspense>
    </div>
  );
}
