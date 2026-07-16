'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Horizontal career journey — Profile → Offer */
export function JourneyInfographic({ className }: { className?: string }) {
  const steps = [
    { n: '01', label: 'Profile', desc: 'Skills & goals' },
    { n: '02', label: 'Resume', desc: 'ATS-ready draft' },
    { n: '03', label: 'SkillCheck', desc: 'Prove ability' },
    { n: '04', label: 'Apply', desc: 'Match & track' },
    { n: '05', label: 'Offer', desc: 'Close the loop' },
  ];

  return (
    <div className={cn('w-full', className)} aria-label="Career journey from profile to offer">
      <div className="grid gap-3 sm:grid-cols-5 sm:gap-0">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="relative flex flex-col sm:items-center sm:text-center"
          >
            {i < steps.length - 1 ? (
              <div
                className="pointer-events-none absolute top-5 left-[2.75rem] right-0 hidden h-px bg-[var(--ct-line)] sm:block"
                aria-hidden
              />
            ) : null}
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--ct-green)] bg-[var(--ct-surface)] text-xs font-bold text-[var(--ct-green)]">
              {step.n}
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--ct-ink)]">{step.label}</p>
            <p className="mt-0.5 text-xs text-[var(--ct-muted)]">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Mini application board stages */
export function PipelineInfographic({ className }: { className?: string }) {
  const columns = [
    { label: 'Saved', count: 8, h: '42%' },
    { label: 'Applied', count: 12, h: '68%' },
    { label: 'Interview', count: 5, h: '38%' },
    { label: 'Offer', count: 2, h: '22%' },
  ];

  return (
    <div
      className={cn(
        'overflow-hidden border border-[var(--ct-line)] bg-[var(--ct-surface)] px-5 py-6 sm:px-8',
        className,
      )}
      aria-label="Application pipeline stages"
    >
      <div className="flex items-end justify-between gap-3 sm:gap-6" style={{ minHeight: 160 }}>
        {columns.map((col, i) => (
          <motion.div
            key={col.label}
            className="flex flex-1 flex-col items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex w-full flex-col items-center justify-end" style={{ height: 120 }}>
              <motion.div
                className="origin-bottom w-full max-w-[4.5rem] rounded-t-md bg-[var(--ct-green)]"
                style={{ height: col.h, opacity: 0.55 + i * 0.12 }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold tabular-nums text-[var(--ct-ink)]">{col.count}</p>
              <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--ct-muted)]">{col.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-[var(--ct-muted)]">
        Illustrative pipeline view — track every role from saved to offer
      </p>
    </div>
  );
}

/** Ecosystem connection diagram */
export function EcosystemInfographic({ className }: { className?: string }) {
  const nodes = [
    { label: 'Resume AI', sub: 'Draft & ATS score', x: '8%', y: '18%' },
    { label: 'SkillCheck', sub: 'Assessments', x: '72%', y: '14%' },
    { label: 'Hub SSO', sub: 'One identity', x: '38%', y: '78%' },
  ];

  return (
    <div
      className={cn('relative overflow-hidden border border-[var(--ct-line)] bg-[var(--ct-surface)]', className)}
      style={{ minHeight: 280 }}
      aria-label="CareerTrack ecosystem connections"
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="ct-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f8a45" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1f8a45" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <line x1="50%" y1="48%" x2="18%" y2="28%" stroke="url(#ct-line-grad)" strokeWidth="2" />
        <line x1="50%" y1="48%" x2="82%" y2="26%" stroke="url(#ct-line-grad)" strokeWidth="2" />
        <line x1="50%" y1="48%" x2="50%" y2="78%" stroke="url(#ct-line-grad)" strokeWidth="2" />
      </svg>

      <div className="absolute left-1/2 top-[42%] z-10 w-[min(220px,70%)] -translate-x-1/2 -translate-y-1/2 border-2 border-[var(--ct-green)] bg-[var(--ct-tint)] px-4 py-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ct-green)]">Center</p>
        <p className="mt-1 text-lg font-semibold text-[var(--ct-ink)]">CareerTrack</p>
        <p className="mt-1 text-xs text-[var(--ct-muted)]">Your job-seeker home</p>
      </div>

      {nodes.map((node) => (
        <div
          key={node.label}
          className="absolute z-10 w-[140px] border border-[var(--ct-line)] bg-white px-3 py-3 shadow-[0_8px_24px_-16px_rgba(18,32,24,0.35)] sm:w-[160px]"
          style={{ left: node.x, top: node.y }}
        >
          <p className="text-sm font-semibold text-[var(--ct-ink)]">{node.label}</p>
          <p className="mt-0.5 text-xs text-[var(--ct-muted)]">{node.sub}</p>
        </div>
      ))}
    </div>
  );
}

/** Free vs Pro value bars */
export function PricingCompareInfographic({ className }: { className?: string }) {
  const rows = [
    { label: 'Job matches', free: 20, pro: 100 },
    { label: 'Resume AI', free: 35, pro: 100 },
    { label: 'SkillCheck', free: 35, pro: 100 },
    { label: 'Insights', free: 25, pro: 95 },
    { label: 'Mock interview', free: 0, pro: 80 },
  ];

  return (
    <div className={cn('space-y-5', className)} aria-label="Free versus Career Pro comparison">
      <div className="flex items-center justify-end gap-5 text-xs font-semibold uppercase tracking-wider">
        <span className="flex items-center gap-2 text-[var(--ct-muted)]">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--ct-line)]" /> Free
        </span>
        <span className="flex items-center gap-2 text-[var(--ct-green)]">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--ct-green)]" /> Career Pro
        </span>
      </div>
      {rows.map((row, i) => (
        <div key={row.label}>
          <p className="mb-2 text-sm font-medium text-[var(--ct-ink)]">{row.label}</p>
          <div className="space-y-1.5">
            <motion.div
              className="origin-left h-2.5 bg-[var(--ct-line)]"
              style={{ width: `${row.free}%` }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
            />
            <motion.div
              className="origin-left h-2.5 bg-[var(--ct-green)]"
              style={{ width: `${row.pro}%` }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 + i * 0.05, duration: 0.45 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Feature coverage radar-like rings (simplified) */
export function FeatureMapInfographic({ className }: { className?: string }) {
  const items = [
    { label: 'Resume AI', angle: -90, r: 38 },
    { label: 'SkillCheck', angle: -18, r: 38 },
    { label: 'Jobs', angle: 54, r: 38 },
    { label: 'Pipeline', angle: 126, r: 38 },
    { label: 'Insights', angle: 198, r: 38 },
  ];

  return (
    <div className={cn('relative mx-auto aspect-square w-full max-w-md', className)} aria-label="CareerTrack feature map">
      <svg viewBox="0 0 320 320" className="h-full w-full">
        {[60, 100, 140].map((r) => (
          <circle key={r} cx="160" cy="160" r={r} fill="none" stroke="#d7e2da" strokeWidth="1" />
        ))}
        {items.map((item) => {
          const rad = (item.angle * Math.PI) / 180;
          const x = 160 + Math.cos(rad) * ((item.r / 100) * 140);
          const y = 160 + Math.sin(rad) * ((item.r / 100) * 140);
          return (
            <g key={item.label}>
              <line x1="160" y1="160" x2={x} y2={y} stroke="#1f8a45" strokeOpacity="0.35" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="8" fill="#1f8a45" />
              <text
                x={x}
                y={y + (y < 160 ? -14 : 22)}
                textAnchor="middle"
                style={{ fontSize: 11, fontWeight: 600, fill: '#122018' }}
              >
                {item.label}
              </text>
            </g>
          );
        })}
        <circle cx="160" cy="160" r="36" fill="#e8f3eb" stroke="#1f8a45" strokeWidth="2" />
        <text x="160" y="156" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: '#1f8a45' }}>
          Career
        </text>
        <text x="160" y="170" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: '#1f8a45' }}>
          Track
        </text>
      </svg>
    </div>
  );
}

/** Support help path */
export function SupportFlowInfographic({ className }: { className?: string }) {
  const steps = [
    { title: 'Find answers', body: 'Search FAQs for sign-in, plans, and apps.' },
    { title: 'Try in-product', body: 'Open Features or Pricing for self-serve guidance.' },
    { title: 'Contact us', body: 'Email support with your CareerTrack account email.' },
  ];

  return (
    <ol className={cn('grid gap-4 md:grid-cols-3', className)} aria-label="How to get support">
      {steps.map((step, i) => (
        <li key={step.title} className="relative border-t-2 border-[var(--ct-green)] pt-5">
          <span className="text-3xl font-semibold tabular-nums text-[var(--ct-green)]/30">{String(i + 1).padStart(2, '0')}</span>
          <h3 className="mt-2 text-base font-semibold text-[var(--ct-ink)]">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--ct-muted)]">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
