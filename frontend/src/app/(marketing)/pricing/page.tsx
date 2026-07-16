'use client';

import Link from 'next/link';
import { Check, CircleHelp } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { PricingCompareInfographic } from '@/components/marketing/infographics';
import { PLAN_CATALOG } from '@/config/plans';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  return (
    <>
      <MarketingHeader active="pricing" />
      <main>
        <section className="border-b border-[var(--ct-line)] bg-[var(--ct-surface)]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ct-green)]">Pricing</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-5xl">
              Start free. Scale when you’re ready.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--ct-muted)]">
              Free covers core search and tracking. Career Pro unlocks Resume AI Pro, SkillCheck Pro, priority insights,
              and a monthly mock interview credit — without buying each tool separately.
            </p>
          </div>
        </section>

        <section className="border-b border-[var(--ct-line)] bg-[var(--ct-canvas)] py-14 sm:py-16">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-3xl">
                Where Pro unlocks more runway
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ct-muted)]">
                Both plans keep you organized. Pro widens match volume and upgrades the adjacent Resume AI + SkillCheck
                experience so preparation and proof keep pace with active applications.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ct-ink)]">
                {[
                  'Free: organize your search and use ecosystem free tiers',
                  'Pro: expand matches, analytics, and pro tool access',
                  'Billing managed after sign-in from your account',
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ct-green)]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <PricingCompareInfographic />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ct-ink)]">Choose a plan</h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--ct-muted)]">
            Transparent monthly pricing. Upgrade or stay free — CareerTrack remains your job-seeker home either way.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {PLAN_CATALOG.map((plan) => (
              <article
                key={plan.key}
                className={cn(
                  'relative flex flex-col border bg-[var(--ct-surface)] p-7 sm:p-8',
                  plan.featured ? 'border-[var(--ct-green)] border-2' : 'border-[var(--ct-line)]',
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-7 bg-[var(--ct-green)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Best for active seekers
                  </span>
                ) : null}
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ct-muted)]">{plan.tag}</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--ct-ink)]">{plan.label}</h3>
                <p className="mt-1 text-sm text-[var(--ct-muted)]">{plan.subtitle}</p>
                <p className="mt-6 text-4xl font-semibold tracking-tight text-[var(--ct-ink)]">
                  {plan.priceMonthly === 0 ? '$0' : `$${plan.priceMonthly}`}
                  {plan.priceMonthly > 0 ? (
                    <span className="text-base font-medium text-[var(--ct-muted)]"> / month</span>
                  ) : (
                    <span className="text-base font-medium text-[var(--ct-muted)]"> forever free</span>
                  )}
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm text-[var(--ct-ink)]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ct-green)]" strokeWidth={2.25} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.key === 'free' ? '/auth/register' : '/auth/register?plan=pro'}
                  className={cn(
                    'mt-8 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition',
                    plan.featured
                      ? 'bg-[var(--ct-green)] text-white hover:bg-[var(--ct-green-deep)]'
                      : 'border border-[var(--ct-line)] bg-white text-[var(--ct-ink)] hover:bg-[var(--ct-tint)]',
                  )}
                >
                  {plan.key === 'free' ? 'Create free account' : 'Start Career Pro'}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 flex gap-3 border-t border-[var(--ct-line)] pt-8 text-sm text-[var(--ct-muted)]">
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ct-green)]" />
            <p>
              Already signed in? Manage upgrades from{' '}
              <Link href="/billing" className="font-semibold text-[var(--ct-green)] hover:underline">
                Billing
              </Link>
              . Questions about what&apos;s included? Visit{' '}
              <Link href="/support" className="font-semibold text-[var(--ct-green)] hover:underline">
                Support
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
