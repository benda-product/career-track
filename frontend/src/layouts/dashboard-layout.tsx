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

  return (
    <SocketProvider>
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar className="hidden lg:flex" />
        <div className="flex flex-1 flex-col">
          <TopNavbar />
          <main className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50/30">
            {children}
          </main>
          <footer className="border-t border-slate-200/60 bg-white/50 py-3.5 px-6 md:flex md:items-center md:justify-between text-[10px] font-semibold text-slate-400">
            <div className="text-center md:text-left">
              <span>&copy; {new Date().getFullYear()} CareerTrack Candidate Suite. A product of </span>
              <a href="https://bendainfotech.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-primary transition-colors">
                Benda Infotech
              </a>
            </div>
            <div className="flex justify-center gap-3.5 mt-2 md:mt-0">
              <a href="#" className="hover:text-slate-600 transition-colors">Candidate Helpdesk</a>
              <span className="text-slate-200 select-none">•</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
              <span className="text-slate-200 select-none">•</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Terms & Service</a>
            </div>
          </footer>
        </div>
      </div>
    </SocketProvider>
  );
}
