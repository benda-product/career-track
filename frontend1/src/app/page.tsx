import Link from 'next/link';
import { ArrowRight, Briefcase, FileText, Kanban, Sparkles, TrendingUp } from 'lucide-react';
import { ButtonLink } from '@/components/ui/link-button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">CareerTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <ButtonLink href="/auth/login" variant="ghost">Sign in</ButtonLink>
            <ButtonLink href="/auth/register">Get Started</ButtonLink>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Candidate Platform
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your career journey,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              beautifully tracked
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Build stunning resumes, discover opportunities, track applications, and land your dream job — all in one premium platform.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="/auth/register" size="lg">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/auth/login" size="lg" variant="outline">
              Sign in to dashboard
            </ButtonLink>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: FileText, title: 'Resume Builder', desc: 'Create ATS-optimized resumes with live preview and scoring.' },
              { icon: Briefcase, title: 'Job Search', desc: 'Browse and apply to jobs with smart filters and recommendations.' },
              { icon: Kanban, title: 'Application Tracking', desc: 'Track every application from applied to hired with kanban views.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border/40 bg-card/50 p-8 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/20 py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold">Ready to accelerate your career?</h2>
            <ButtonLink href="/auth/register">Create your free account</ButtonLink>
          </div>
        </section>
      </main>
    </div>
  );
}
