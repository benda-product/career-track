export function formatLevel(level: string) {
  if (!level) return '—';
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatCategory(category: string) {
  if (!category) return 'Unknown skill';
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function passBadgeClass(passed: boolean) {
  return passed
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-slate-200 bg-slate-50 text-slate-600';
}

export function isCertificateEligible(test: {
  level?: string;
  percentage?: number;
  marksObtained?: number;
  fullMarks?: number;
}) {
  const level = (test.level || '').toLowerCase();
  const percentage =
    typeof test.percentage === 'number'
      ? test.percentage
      : test.fullMarks
        ? Math.round(((test.marksObtained || 0) / test.fullMarks) * 100)
        : 0;
  return level === 'hard' && percentage >= 80;
}
