'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { EcosystemAdminConsoleSwitcher } from '@/components/admin/ecosystem-admin-console-switcher';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (hasHydrated && user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FB]">
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <Link href="/admin" className="flex items-center gap-3">
            <CareerTrackLogo size="md" />
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Console</p>
          <div className="mt-3">
            <EcosystemAdminConsoleSwitcher currentId="career-track" />
          </div>
        </div>
        <nav className="flex-1 p-3">
          <Link
            href="/admin"
            className="block rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-[#015DC0]"
          >
            Overview
          </Link>
          <Link
            href="/dashboard"
            className="mt-1 block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Candidate dashboard
          </Link>
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-semibold text-slate-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <button
            type="button"
            onClick={() => {
              clearAuth();
              router.push('/auth/login');
            }}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
          © {new Date().getFullYear()} Career Track Admin • Powered by Benda Infotech
        </footer>
      </div>
    </div>
  );
}
