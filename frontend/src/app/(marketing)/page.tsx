'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardCheck, FileText, Kanban, Search, Sparkles } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';
import { JourneyInfographic, PipelineInfographic } from '@/components/marketing/infographics';

export default function HomePage() {
  return (
    <>
      <MarketingHeader />

      <section className="relative isolate min-h-[min(92vh,920px)] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2400&q=80')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(105deg,rgba(12,28,18,0.88)_0%,rgba(12,28,18,0.72)_42%,rgba(12,28,18,0.35)_100%)]"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[min(92vh,920px)] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <CareerTrackLogo size="xl" variant="dark" className="mb-8 h-14 sm:h-16" />
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
              Your career pipeline, from resume to offer.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/78 sm:text-lg">
              CareerTrack is the job-seeker workspace that connects Resume AI, SkillCheck, matching, and application
              tracking — so your search stays organized through every stage.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--ct-green)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--ct-green-bright)]"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/16"
              >
                See features
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-[var(--ct-line)] bg-[var(--ct-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ct-green)]">How the search flows</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-4xl">
            Five stages. One continuous track.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[var(--ct-muted)]">
            Most seekers bounce between documents, test sites, and spreadsheets. CareerTrack keeps the journey in order —
            so nothing falls between tools.
          </p>
          <div className="mt-12">
            <JourneyInfographic />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--ct-line)] bg-[var(--ct-canvas)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ct-green)]">Application clarity</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-4xl">
                See where every role stands.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--ct-muted)]">
                Save interesting jobs, move them from applied to interview, and celebrate offers without rebuilding
                status in a personal spreadsheet. The pipeline is built for weekly job-search rhythm — not hiring-team
                workflows.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ct-ink)]">
                {[
                  'Saved → Applied → Interview → Offer stages',
                  'Recommended matches based on your profile',
                  'Notes and follow-ups next to each opportunity',
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ct-green)]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <PipelineInfographic />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--ct-line)] bg-[var(--ct-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ct-green)]">What you get</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-4xl">
            Tools that support the full search — not just one step.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: 'Resume AI',
                body: 'Draft, score, and export resumes that survive ATS parsers before you hit Apply.',
              },
              {
                icon: ClipboardCheck,
                title: 'SkillCheck',
                body: 'Practice assessments and carry verified skill results into your applications.',
              },
              {
                icon: Search,
                title: 'Job matching',
                body: 'Discover roles aligned to your profile, then save or apply without losing context.',
              },
              {
                icon: Kanban,
                title: 'Pipeline',
                body: 'Track status for every opportunity and keep momentum between follow-ups.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="border-t border-[var(--ct-line)] pt-5"
              >
                <item.icon className="h-6 w-6 text-[var(--ct-green)]" strokeWidth={1.75} />
                <h3 className="mt-4 text-lg font-semibold text-[var(--ct-ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ct-muted)]">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(46,160,78,0.14), transparent 55%), var(--ct-canvas)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 text-center sm:px-6">
          <Sparkles className="mx-auto h-6 w-6 text-[var(--ct-green)]" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-4xl">
            Built for job seekers — not recruiters.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--ct-muted)]">
            Free to start. Upgrade to Career Pro when you want Resume AI Pro, SkillCheck Pro, priority insights, and mock
            interview credits in one plan.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ct-green)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--ct-green-deep)]"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-xl border border-[var(--ct-line)] bg-[var(--ct-surface)] px-5 py-3 text-sm font-semibold text-[var(--ct-ink)] transition hover:bg-white"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
