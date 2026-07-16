'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  ClipboardCheck,
  FileText,
  Kanban,
  MessageSquare,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { FeatureMapInfographic, JourneyInfographic } from '@/components/marketing/infographics';

const FEATURE_BLOCKS = [
  {
    id: 'resume',
    icon: FileText,
    title: 'Resume AI',
    body: 'Draft bullet points, rewrite summaries, and export formats built for ATS readability. Score your resume against role language before you apply — then jump back into CareerTrack with the latest version attached to your profile.',
    points: ['ATS-oriented scoring', 'Rewrite & export flows', 'SSO into Resume AI'],
  },
  {
    id: 'skills',
    icon: ClipboardCheck,
    title: 'SkillCheck',
    body: 'Practice coding and aptitude assessments that employers recognize. Results stay linked to your job-seeker identity so you can show proof of skill next to applications — without managing a separate login.',
    points: ['Timed assessments', 'Progress history', 'SSO into SkillCheck'],
  },
  {
    id: 'pipeline',
    icon: Kanban,
    title: 'Application pipeline',
    body: 'Keep every opportunity on a stage board: saved, applied, interview, offer. Add notes, update status after recruiter calls, and see where to put energy this week.',
    points: ['Stage tracking', 'Saved roles', 'Weekly follow-through'],
  },
  {
    id: 'jobs',
    icon: Search,
    title: 'Job matching',
    body: 'Browse listings and get recommended matches from your profile signals — skills, preferences, and experience — so discovery feels purposeful instead of endless scroll.',
    points: ['Search & filters', 'Recommended matches', 'Save and apply path'],
  },
  {
    id: 'insights',
    icon: BarChart3,
    title: 'Career insights',
    body: 'Career Pro unlocks deeper analytics on how your search is performing: match volume, activity trends, and priority job insights so you can adjust strategy mid-search.',
    points: ['Activity signals', 'Priority insights', 'Pro analytics'],
  },
  {
    id: 'coaching',
    icon: MessageSquare,
    title: 'Mock interview practice',
    body: 'Warm up for real conversations with focused practice topics. Career Pro includes monthly mock interview credits so preparation sits next to your live pipeline.',
    points: ['Topic practice', 'Monthly Pro credit', 'Interview readiness'],
  },
] as const;

export default function FeaturesPage() {
  return (
    <>
      <MarketingHeader active="features" />
      <main>
        <section className="relative overflow-hidden border-b border-[var(--ct-line)]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(232,245,234,0.9) 0%, var(--ct-canvas) 70%), radial-gradient(ellipse at top right, rgba(46,160,78,0.12), transparent 50%)',
            }}
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ct-green)]">Features</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-5xl">
                Everything between “I need a role” and “I got an offer.”
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--ct-muted)]">
                CareerTrack brings resume craft, skill proof, discovery, and follow-through into one workspace — designed
                for seekers, not recruiter pipelines.
              </p>
            </div>
            <FeatureMapInfographic className="mx-auto w-full max-w-sm lg:max-w-none" />
          </div>
        </section>

        <section className="border-b border-[var(--ct-line)] bg-[var(--ct-surface)] py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-3xl">
              End-to-end capability map
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[var(--ct-muted)]">
              Each capability feeds the next. A stronger resume improves matches. Skill proof supports interviews. The
              pipeline makes sure momentum doesn&apos;t stall after Apply.
            </p>
            <div className="mt-10">
              <JourneyInfographic />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="space-y-14">
            {FEATURE_BLOCKS.map((feature, i) => (
              <motion.article
                key={feature.id}
                id={feature.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4 }}
                className="scroll-mt-28 grid gap-6 border-t border-[var(--ct-line)] pt-10 md:grid-cols-[180px_1fr] md:gap-10"
              >
                <div>
                  <feature.icon className="h-7 w-7 text-[var(--ct-green)]" strokeWidth={1.75} />
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ct-muted)]">
                    0{i + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--ct-ink)]">{feature.title}</h2>
                </div>
                <div>
                  <p className="text-[0.975rem] leading-relaxed text-[var(--ct-muted)]">{feature.body}</p>
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-center gap-2 text-sm font-medium text-[var(--ct-ink)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ct-green)]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-4 bg-[var(--ct-ink)] px-6 py-8 text-white sm:px-8">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Open the full workspace</h2>
              <p className="mt-2 text-sm text-white/70">
                Create a free account — Resume AI and SkillCheck stay one switch away after sign-in.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ct-green)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ct-green-bright)]"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 space-y-3 text-sm text-[var(--ct-muted)]">
            <div className="flex items-start gap-3">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ct-green)]" />
              <p>
                Recruiters should use <span className="font-semibold text-[var(--ct-ink)]">Talent Desk</span>. CareerTrack
                is purpose-built for job seekers.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ct-green)]" />
              <p>Google or email sign-in uses the shared Benda Infotech identity across Hub products.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
