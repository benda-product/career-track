'use client';

import { useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { skillCheckService } from '@/services/skillCheck.service';
import type { RecommendedAssessment } from '@/types';

type Props = {
  assessment: RecommendedAssessment;
  detailsOpen: boolean;
  onDetailsOpenChange: (open: boolean) => void;
};

function formatLevel(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function JobRecommendedAssessment({
  assessment,
  detailsOpen,
  onDetailsOpenChange,
}: Props) {
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');

  async function takeAssessment() {
    setError('');
    setLaunching(true);
    try {
      const returnUrl = window.location.href;
      await skillCheckService.openTargetPath(assessment.targetPath, returnUrl);
    } catch (err: unknown) {
      setLaunching(false);
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Unable to open the recommended SkillCheck assessment.'
      );
    }
  }

  return (
    <>
      <Card className="border-primary/20 bg-primary/5 ring-primary/15">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Recommended for Your Application
              </p>
              <h2 className="text-lg font-semibold tracking-tight">{assessment.title}</h2>
              <p className="text-sm text-muted-foreground">
                Recommended for: <span className="font-medium text-foreground">{assessment.recommendedFor}</span>
              </p>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            This SkillCheck assessment is suggested for this role. It is optional and is not required to apply.
          </p>

          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onDetailsOpenChange(true)}>
              View Recommended Test
            </Button>
            <Button type="button" onClick={() => void takeAssessment()} disabled={launching}>
              {launching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
              Take Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={onDetailsOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recommended Skill Assessment</DialogTitle>
            <DialogDescription>
              Review this optional SkillCheck test before you decide to take it. Applying does not require this assessment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div>
              <p className="text-base font-semibold">{assessment.title}</p>
              <p className="text-sm text-muted-foreground">
                Recommended for: <span className="font-medium text-foreground">{assessment.recommendedFor}</span>
              </p>
            </div>

            {assessment.prerequisite ? (
              <p className="text-sm text-muted-foreground">
                Suggested background: {assessment.prerequisite}
              </p>
            ) : null}

            {assessment.levels?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {assessment.levels.map((level) => (
                  <Badge key={level} variant="outline">
                    {formatLevel(level)}
                  </Badge>
                ))}
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onDetailsOpenChange(false)} disabled={launching}>
              Close
            </Button>
            <Button type="button" onClick={() => void takeAssessment()} disabled={launching}>
              {launching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
              Take Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
