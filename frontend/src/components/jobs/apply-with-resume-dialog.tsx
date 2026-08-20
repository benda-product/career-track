'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getResumeId, type ResumeItem } from '@/services/resume.service';
import { cn } from '@/lib/utils';
import type { RecommendedAssessment } from '@/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  company?: string;
  resumes: ResumeItem[];
  defaultResumeId?: string | null;
  profileResumeId?: string | null;
  submitting?: boolean;
  onSubmit: (resumeId: string) => void;
  onCreateResume: () => void;
  recommendedAssessment?: RecommendedAssessment | null;
  onViewRecommendedTest?: () => void;
};

export function ApplyWithResumeDialog({
  open,
  onOpenChange,
  jobTitle,
  company,
  resumes,
  defaultResumeId,
  profileResumeId,
  submitting = false,
  onSubmit,
  onCreateResume,
  recommendedAssessment,
  onViewRecommendedTest,
}: Props) {
  const initialSelection = useMemo(() => {
    if (defaultResumeId) return defaultResumeId;
    if (profileResumeId) return profileResumeId;
    return getResumeId(resumes[0] || {});
  }, [defaultResumeId, profileResumeId, resumes]);

  const [selectedResumeId, setSelectedResumeId] = useState(initialSelection);

  useEffect(() => {
    if (open) {
      setSelectedResumeId(initialSelection);
    }
  }, [open, initialSelection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a resume</DialogTitle>
          <DialogDescription>
            Select which CV to submit for <span className="font-medium text-foreground">{jobTitle}</span>
            {company ? ` at ${company}` : ''}.
          </DialogDescription>
        </DialogHeader>

        {resumes.length ? (
          <ul className="max-h-64 space-y-2 overflow-y-auto py-1">
            {resumes.map((resume, index) => {
              const resumeId = getResumeId(resume);
              const isSelected = selectedResumeId === resumeId;
              const isProfileResume = profileResumeId === resumeId;

              return (
                <li key={resumeId || index}>
                  <button
                    type="button"
                    disabled={!resumeId || submitting}
                    onClick={() => resumeId && setSelectedResumeId(resumeId)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        isSelected ? 'border-primary' : 'border-muted-foreground/40'
                      )}
                    >
                      {isSelected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {resume.title || `Resume ${index + 1}`}
                      </span>
                      {isProfileResume ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Default recruiter-visible resume
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any saved resumes yet. Create one in Resume Builder to apply.
          </p>
        )}

        {recommendedAssessment ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
            <p className="font-medium">{recommendedAssessment.title}</p>
            <p className="mt-0.5 text-muted-foreground">
              Optional SkillCheck suggestion for this role. It is not required to submit your application.
            </p>
            {onViewRecommendedTest ? (
              <Button
                type="button"
                variant="link"
                className="mt-1 h-auto px-0"
                onClick={onViewRecommendedTest}
              >
                View Recommended Test
              </Button>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onCreateResume} disabled={submitting}>
            <Plus className="mr-2 h-4 w-4" />
            New resume
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => selectedResumeId && onSubmit(selectedResumeId)}
              disabled={!selectedResumeId || submitting || !resumes.length}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit application
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
