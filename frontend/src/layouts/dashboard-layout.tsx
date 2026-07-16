'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/resume/Sidebar';
import { TopNavbar } from '@/components/resume/TopNavbar';
import { SocketProvider } from '@/components/providers/socket-provider';
import { useAuthStore } from '@/store/auth.store';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const bendaHubUrl = process.env.NEXT_PUBLIC_BENDA_URL || 'http://localhost:3004';

  return (
    <SocketProvider>
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar className="hidden lg:flex" />
        <div className="flex flex-1 flex-col">
          <TopNavbar />
          <main className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50/30">
            {children}
          </main>
          <footer className="border-t border-slate-200/60 bg-white/50 px-6 py-3.5 text-center text-[11px] font-medium text-slate-400">
            <span>
              © {new Date().getFullYear()} CareerTrack • Powered by{' '}
              <a
                href={bendaHubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 transition-colors hover:text-primary"
              >
                Benda Infotech
              </a>
              .
            </span>
          </footer>
        </div>
      </div>
    </SocketProvider>
  );
}
