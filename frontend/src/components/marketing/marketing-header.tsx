'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/support', label: 'Support' },
] as const;

type MarketingHeaderProps = {
  active?: 'features' | 'pricing' | 'integrations' | 'support' | 'home';
};

export function MarketingHeader({ active }: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ct-line)] bg-[color-mix(in_oklab,var(--ct-surface)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:h-[4.25rem] sm:px-6">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-85"
          aria-label="CareerTrack home"
          onClick={() => setOpen(false)}
        >
          <CareerTrackLogo size="md" className="h-8 sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const isActive = active === item.href.slice(1);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-3.5 py-2 text-[0.9375rem] font-medium tracking-tight transition-colors',
                  isActive
                    ? 'text-[var(--ct-ink)]'
                    : 'text-[var(--ct-muted)] hover:text-[var(--ct-ink)]',
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'absolute inset-x-3.5 -bottom-[1.15rem] h-[2px] rounded-full bg-[var(--ct-green)] transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className="hidden text-[0.9375rem] font-semibold tracking-tight text-[var(--ct-ink)]/75 transition-colors hover:text-[var(--ct-ink)] sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-[var(--ct-green)] px-3.5 py-2 text-sm font-semibold tracking-tight text-white transition hover:bg-[var(--ct-green-deep)] sm:px-4"
          >
            Get started
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ct-line)] text-[var(--ct-ink)] transition hover:bg-[var(--ct-tint)] lg:hidden"
            aria-expanded={open}
            aria-controls="marketing-mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" strokeWidth={2} /> : <Menu className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div
        id="marketing-mobile-nav"
        className={cn(
          'border-t border-[var(--ct-line)] bg-[var(--ct-surface)] lg:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-6" aria-label="Mobile">
          {NAV.map((item) => {
            const isActive = active === item.href.slice(1);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'border-b border-[var(--ct-line)]/70 py-3.5 text-[0.9375rem] font-medium tracking-tight last:border-b-0',
                  isActive ? 'text-[var(--ct-green)]' : 'text-[var(--ct-ink)]',
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="py-3.5 text-[0.9375rem] font-semibold text-[var(--ct-muted)] sm:hidden"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
