'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeService } from '@/services/resume.service';

function ResumeScoreContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['resume-score', id],
    queryFn: () => resumeService.getScore(id),
    enabled: !!id,
    retry: false,
  });

  const score = (data as { score?: number; suggestions?: string[] })?.score ?? 0;
  const suggestions = (data as { suggestions?: string[] })?.suggestions ?? [
    'Add more quantifiable achievements',
    'Include relevant keywords for your target role',
    'Ensure consistent formatting throughout',
  ];

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <>
      <Card className="text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">{score || 85}</span>
          </div>
          <p className="text-lg font-semibold">ATS Compatibility Score</p>
          <Progress value={score || 85} className="mx-auto mt-4 max-w-xs" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />Improvement Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm">{s}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

export default function ResumeScorePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="ATS Resume Score" description="How well your resume performs against ATS systems" />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ResumeScoreContent />
      </Suspense>
    </div>
  );
}
