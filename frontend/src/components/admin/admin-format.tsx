import { format } from 'date-fns';
import { APPLICATION_STAGES } from '@/constants';
import { cn } from '@/lib/utils';

export function formatAdminDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy');
}

export function stageLabel(stage?: string) {
  return APPLICATION_STAGES.find((item) => item.value === stage)?.label || stage || 'Unknown';
}

export function stageBadgeClass(stage?: string) {
  switch (stage) {
    case 'applied':
      return 'bg-sky-50 text-sky-700 border-sky-100';
    case 'screening':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'shortlisted':
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    case 'interview':
      return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'offer':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'hired':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

export function StageBadge({ stage }: { stage?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        stageBadgeClass(stage)
      )}
    >
      {stageLabel(stage)}
    </span>
  );
}
