'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, KeyRound, Link2, RefreshCw } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { EcosystemInfographic } from '@/components/marketing/infographics';

const INTEGRATIONS = [
  {
    name: 'Resume AI',
    role: 'Resumes & ATS scoring',
    detail:
      'Open Resume AI from the CareerTrack sidebar or app switcher. Build and score resumes, export ATS-friendly files, then return to your pipeline with the same Hub identity — no second password to manage.',
    href: process.env.NEXT_PUBLIC_RESUME_BUILDER_URL || 'http://localhost:3001',
    steps: ['Launch from CT sidebar', 'Draft & score', 'Return to applications'],
  },
  {
    name: 'SkillCheck',
    role: 'Skill assessments',
    detail:
      'Take timed assessments in SkillCheck, review history and certificates where available, and keep results associated with your job-seeker profile for applications and credibility.',
    href: process.env.NEXT_PUBLIC_SKILL_TEST_URL || 'http://localhost:3005',
    steps: ['Launch assessment', 'Complete SkillCheck', 'Carry results into CT'],
  },
  {
    name: 'Benda Infotech Hub',
    role: 'Central identity',
    detail:
      'Continue with Google (or email) on the shared Benda Firebase project. Your job-seeker role stays aligned across CareerTrack and Hub, so you are not asked to reinvent your account for every product.',
    href: process.env.NEXT_PUBLIC_BENDA_URL || 'http://localhost:3004',
    steps: ['Sign in once', 'Role-aware access', 'Switch products freely'],
  },
] as const;

export default function IntegrationsPage() {
  return (
    <>
      <MarketingHeader active="integrations" />
      <main>
        <section className="relative overflow-hidden border-b border-[var(--ct-line)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 0%, rgba(46,160,78,0.16), transparent 55%), var(--ct-canvas)',
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ct-green)]">Integrations</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-5xl">
              One identity across the Benda ecosystem.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--ct-muted)]">
              CareerTrack is the home base. Resume AI and SkillCheck plug in through SSO so tools stay specialized —
              while your search stays unified.
            </p>
          </div>
        </section>

        <section className="border-b border-[var(--ct-line)] bg-[var(--ct-surface)] py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--ct-ink)]">Ecosystem map</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ct-muted)]">
              CareerTrack sits at the center of your job-seeker workflow. Connected products handle deep work — resumes,
              assessments, and identity — without fragmenting your account.
            </p>
            <div className="mt-8">
              <EcosystemInfographic />
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--ct-line)] bg-[var(--ct-canvas)] py-12 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-6 md:grid-cols-3">
            {[
              {
                icon: KeyRound,
                title: 'Shared SSO',
                body: 'Google / email identity works across CareerTrack and sibling apps you already belong to.',
              },
              {
                icon: Link2,
                title: 'In-product switcher',
                body: 'Jump to Resume AI or SkillCheck from the dashboard header without losing context.',
              },
              {
                icon: RefreshCw,
                title: 'Continuous loop',
                body: 'Improve documents and skills, then bring evidence back into jobs and applications.',
              },
            ].map((item) => (
              <div key={item.title} className="border-t border-[var(--ct-line)] pt-5">
                <item.icon className="h-5 w-5 text-[var(--ct-green)]" />
                <h3 className="mt-3 text-base font-semibold text-[var(--ct-ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ct-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ct-ink)]">Connected products</h2>
          <div className="mt-8 space-y-0 divide-y divide-[var(--ct-line)] border-y border-[var(--ct-line)]">
            {INTEGRATIONS.map((item) => (
              <article key={item.name} className="grid gap-5 py-9 md:grid-cols-[200px_1fr_auto] md:gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ct-ink)]">{item.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--ct-green)]">
                    {item.role}
                  </p>
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-[var(--ct-muted)]">{item.detail}</p>
                  <ol className="mt-4 flex flex-wrap gap-2">
                    {item.steps.map((step, idx) => (
                      <li
                        key={step}
                        className="inline-flex items-center gap-1.5 border border-[var(--ct-line)] bg-[var(--ct-surface)] px-2.5 py-1 text-xs font-medium text-[var(--ct-ink)]"
                      >
                        <span className="text-[var(--ct-green)]">{idx + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-fit items-center gap-1 text-sm font-semibold text-[var(--ct-green)] hover:underline"
                >
                  Open <ArrowUpRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ct-green)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ct-green-deep)]"
            >
              Sign in to switch apps
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm text-[var(--ct-muted)]">
              After login, use the app switcher beside the logo in your dashboard.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
