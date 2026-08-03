import { APPLICATION_STAGES } from '@/constants';
import type { Application, ApplicationStage } from '@/types';

const ATS_STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  assessment: 'Assessment',
  shortlisted: 'Shortlisted',
  interview_round_1: 'Interview Round 1',
  interview_round_2: 'Interview Round 2',
  final_interview: 'Final Interview',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer_sent: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  offer_released: 'Offer Released',
  selected: 'Selected',
  hired: 'Hired',
  rejected: 'Rejected',
  on_hold: 'On Hold',
};

export function formatAtsStageLabel(atsStage?: string | null): string | null {
  if (!atsStage) return null;
  const key = String(atsStage).toLowerCase().trim();
  return (
    ATS_STAGE_LABELS[key] ||
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Prefer Talent Desk stage label when synced; otherwise Career Track stage. */
export function getApplicationStatusLabel(
  app: Pick<Application, 'stage' | 'atsStage'> | { stage: ApplicationStage; atsStage?: string }
): string {
  return (
    formatAtsStageLabel(app.atsStage) ||
    APPLICATION_STAGES.find((s) => s.value === app.stage)?.label ||
    app.stage
  );
}

export function getApplicationStageStyles(stage: string) {
  switch (stage) {
    case 'applied':
      return {
        dot: 'bg-sky-500',
        badge:
          'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50',
        border: 'before:bg-sky-500',
      };
    case 'screening':
      return {
        dot: 'bg-amber-500',
        badge:
          'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
        border: 'before:bg-amber-500',
      };
    case 'shortlisted':
      return {
        dot: 'bg-indigo-500',
        badge:
          'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50',
        border: 'before:bg-indigo-500',
      };
    case 'interview':
      return {
        dot: 'bg-orange-500',
        badge:
          'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50',
        border: 'before:bg-orange-500',
      };
    case 'offer':
      return {
        dot: 'bg-emerald-500',
        badge:
          'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        border: 'before:bg-emerald-500',
      };
    case 'rejected':
      return {
        dot: 'bg-rose-500',
        badge:
          'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
        border: 'before:bg-rose-500',
      };
    case 'hired':
      return {
        dot: 'bg-primary',
        badge:
          'bg-primary/10 text-primary border-primary/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        border: 'before:bg-primary',
      };
    default:
      return {
        dot: 'bg-slate-500',
        badge:
          'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800',
        border: 'before:bg-slate-500',
      };
  }
}
