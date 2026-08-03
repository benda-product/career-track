'use client';

import Link from 'next/link';
import { HelpCircle, LifeBuoy, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { SupportFlowInfographic } from '@/components/marketing/infographics';

const FAQS = [
  {
    q: 'Who is CareerTrack for?',
    a: 'Job seekers who need a single place for resumes, skill proof, job matches, and application tracking. Recruiters and hiring teams should use Talent Desk instead.',
  },
  {
    q: 'Can I use the same Google account as Benda Infotech?',
    a: 'Yes. Continue with Google uses the shared Benda Infotech Firebase project so your Hub identity links across CareerTrack, Resume AI, and SkillCheck when your role matches.',
  },
  {
    q: 'What is included in Career Pro?',
    a: 'Career Pro includes CareerTrack pro features plus Resume AI Pro and SkillCheck Pro, priority job insights, advanced analytics, and one mock interview credit per month.',
  },
  {
    q: 'How do I open Resume AI or SkillCheck?',
    a: 'From your CareerTrack dashboard, use the Resume Builder or SkillCheck sections in the sidebar, or open the app switcher next to the CareerTrack logo.',
  },
  {
    q: 'I signed in but see a role mismatch.',
    a: 'CareerTrack expects a job-seeker role. If your Hub account is recruiter-focused, use Talent Desk for hiring workflows, or contact support if your role was set incorrectly.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Use Forgot password on Benda Infotech (hub) with the email on your account. Google users can continue signing in with Google without a separate CareerTrack password.',
  },
] as const;

export default function SupportPage() {
  return (
    <>
      <MarketingHeader active="support" />
      <main>
        <section className="border-b border-[var(--ct-line)] bg-[var(--ct-surface)]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ct-green)]">Support</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-5xl">
              Help for your job search workspace.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--ct-muted)]">
              Answers for signing in, plans, switching apps, and getting unblocked so your search can keep moving.
            </p>
          </div>
        </section>

        <section className="border-b border-[var(--ct-line)] bg-[var(--ct-canvas)] py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--ct-ink)]">How support works</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ct-muted)]">
              Most questions resolve with product docs or account self-serve. Escalate to email when something needs a
              human — include the address you use on CareerTrack.
            </p>
            <div className="mt-10">
              <SupportFlowInfographic />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: HelpCircle,
                title: 'Product help',
                body: 'Learn how resumes, skills, matching, and the pipeline connect across the full seeker journey.',
                href: '/features',
                cta: 'View features',
              },
              {
                icon: LifeBuoy,
                title: 'Plans & billing',
                body: 'Compare Free vs Career Pro, then manage upgrades after you sign in from Billing.',
                href: '/pricing',
                cta: 'View pricing',
              },
              {
                icon: MessageCircle,
                title: 'Account access',
                body: 'Sign in with Google or email. Reset a password from the login screen if needed.',
                href: '/auth/login',
                cta: 'Go to sign in',
              },
            ].map((item) => (
              <div key={item.title} className="border-t border-[var(--ct-line)] pt-5">
                <item.icon className="h-5 w-5 text-[var(--ct-green)]" />
                <h2 className="mt-3 text-base font-semibold text-[var(--ct-ink)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ct-muted)]">{item.body}</p>
                <Link href={item.href} className="mt-3 inline-block text-sm font-semibold text-[var(--ct-green)] hover:underline">
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-start gap-3 border border-[var(--ct-line)] bg-[var(--ct-tint)] px-4 py-4 text-sm text-[var(--ct-ink)]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ct-green)]" />
            <p>
              Tip: if Google sign-in fails with a role message, you may be on a recruiter Hub account — Talent Desk is the
              correct product for hiring teams.
            </p>
          </div>
        </section>

        <section className="border-t border-[var(--ct-line)] bg-[var(--ct-canvas)]">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--ct-ink)]">Frequently asked</h2>
            <div className="mt-8 space-y-6">
              {FAQS.map((item) => (
                <div key={item.q} className="border-t border-[var(--ct-line)] pt-5">
                  <h3 className="text-base font-semibold text-[var(--ct-ink)]">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ct-muted)]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 border-t border-[var(--ct-line)] bg-[var(--ct-surface)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ct-ink)]">Still need help?</h2>
              <p className="mt-2 max-w-lg text-sm text-[var(--ct-muted)]">
                Email the Benda Infotech team for account or billing questions. Include your CareerTrack email and a short
                description of what you tried.
              </p>
            </div>
            <a
              href="mailto:support@bendainfotech.com"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ct-green)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ct-green-deep)]"
            >
              <Mail className="h-4 w-4" />
              support@bendainfotech.com
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
