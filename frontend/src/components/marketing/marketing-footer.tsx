import Link from 'next/link';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';

const FOOTER_LINKS = [
  {
    title: 'Pages',
    links: [
      { href: '/', label: 'Home' },
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/integrations', label: 'Integrations' },
      { href: '/support', label: 'Support' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/auth/login', label: 'Sign in' },
      { href: '/auth/register', label: 'Create account' },
      { href: '/auth/forgot-password', label: 'Forgot password' },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-[var(--ct-line)] bg-[#0d1a12] text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ct-green)]/50 to-transparent"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 sm:px-6 sm:pt-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr] md:gap-10">
          <div className="max-w-sm">
            <Link href="/" aria-label="CareerTrack home" className="inline-block">
              <CareerTrackLogo size="md" variant="dark" className="h-9 sm:h-10" />
            </Link>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-white/60">
              The job-seeker workspace for resumes, skill proof, matching, and application tracking.
            </p>
            <Link
              href="/auth/register"
              className="mt-6 inline-flex text-sm font-semibold tracking-tight text-[var(--ct-green-bright)] transition hover:text-white"
            >
              Get started free →
            </Link>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/40">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-white/10 pt-6">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Benda Infotech. CareerTrack is built for job seekers.
          </p>
        </div>
      </div>
    </footer>
  );
}
