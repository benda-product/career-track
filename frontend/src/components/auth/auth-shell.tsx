import Link from 'next/link';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  mode: 'login' | 'register';
};

export function AuthShell({ children, title, subtitle, mode }: AuthShellProps) {
  return (
    <div className="marketing-shell relative flex min-h-screen bg-[var(--ct-canvas)] text-[var(--ct-ink)]">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] overflow-hidden lg:flex lg:flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=80')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(160deg,rgba(10,24,16,0.92)_0%,rgba(15,40,24,0.82)_45%,rgba(18,50,30,0.7)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 15%, rgba(80,190,110,0.35), transparent 42%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.12), transparent 40%)',
          }}
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <Link href="/" aria-label="CareerTrack home">
            <CareerTrackLogo size="md" variant="dark" className="h-10" />
          </Link>

          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ct-green-bright)]">
              CareerTrack
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-white xl:text-4xl">
              {mode === 'login'
                ? 'Pick up where your job search left off.'
                : 'Build the workspace that carries you from resume to offer.'}
            </h2>
            <p className="mt-4 text-[0.975rem] leading-relaxed text-white/70">
              Resumes, SkillCheck, job matches, and application tracking — one identity across the Benda ecosystem.
            </p>
          </div>

          <p className="text-xs text-white/45">Built for job seekers · Benda Infotech</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 100% 0%, rgba(46,160,78,0.08), transparent 55%), var(--ct-canvas)',
          }}
          aria-hidden
        />

        <div className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/" className="lg:invisible" aria-label="CareerTrack home">
            <CareerTrackLogo size="md" className="h-8" />
          </Link>
          <p className="text-sm text-[var(--ct-muted)]">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <Link href="/auth/register" className="font-semibold text-[var(--ct-green)] hover:text-[var(--ct-green-deep)]">
                  Create account
                </Link>
              </>
            ) : (
              <>
                Have an account?{' '}
                <Link href="/auth/login" className="font-semibold text-[var(--ct-green)] hover:text-[var(--ct-green-deep)]">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="relative z-10 flex flex-1 items-start justify-center px-5 pb-12 pt-4 sm:items-center sm:px-8 sm:pb-16 sm:pt-0">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--ct-ink)] sm:text-[2rem]">{title}</h1>
              <p className="mt-2 text-[0.975rem] leading-relaxed text-[var(--ct-muted)]">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
