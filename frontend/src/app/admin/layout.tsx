'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { SocketProvider } from '@/components/providers/socket-provider';
import { useAuthStore } from '@/store/auth.store';
import { restoreAuthSession } from '@/lib/auth-session';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;
    restoreAuthSession().finally(() => {
      if (!cancelled) setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || !sessionReady) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace(user && user.role !== 'admin' ? '/dashboard' : '/auth/login?redirect=/admin');
    }
  }, [hasHydrated, sessionReady, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || user?.role !== 'admin' || !sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bendaHubUrl = process.env.NEXT_PUBLIC_BENDA_URL || 'http://localhost:3004';

  return (
    <SocketProvider>
      <div className="flex min-h-screen bg-slate-50/50">
        <AdminSidebar className="hidden lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-auto bg-slate-50/30 p-4 lg:p-6">
            <Suspense
              fallback={
                <div className="flex min-h-[40vh] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              {children}
            </Suspense>
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
