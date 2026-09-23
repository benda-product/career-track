'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { useAuthStore, getStoredRefreshToken } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { useSocketStatus } from '@/components/providers/socket-provider';

function searchDestination(pathname: string) {
  if (pathname.startsWith('/admin/profiles')) return '/admin/profiles';
  if (pathname.startsWith('/admin/applications')) return '/admin/applications';
  if (pathname.startsWith('/admin/saved-jobs')) return '/admin/saved-jobs';
  if (pathname.startsWith('/admin/jobs')) return '/admin/jobs';
  if (pathname.startsWith('/admin/activity')) return '/admin/activity';
  return '/admin/candidates';
}

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const [search, setSearch] = useState('');
  const socketStatus = useSocketStatus();

  const handleLogout = async () => {
    const token = refreshToken || getStoredRefreshToken();
    if (token) await authService.logout(token);
    clearAuth();
    router.push('/auth/login');
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    const destination = searchDestination(pathname);
    router.push(query ? `${destination}?q=${encodeURIComponent(query)}` : destination);
  };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'AD';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 shadow-sm backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0">
            <AdminSidebar className="flex" />
          </SheetContent>
        </Sheet>

        <span className="hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary sm:inline-flex">
          <Sparkles className="h-3 w-3" /> Admin Console
        </span>
      </div>

      <form onSubmit={handleSearch} className="mx-4 flex max-w-md flex-1">
        <div className="group relative w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search candidates, jobs, applications..."
            className="h-9 w-full rounded-lg border-slate-200/80 bg-slate-50 pl-9 pr-12 text-xs text-slate-800 focus-visible:ring-primary/20"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <div
          className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold md:flex ${
            socketStatus === 'connected'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : socketStatus === 'connecting'
                ? 'border-amber-100 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <span className="relative flex h-1.5 w-1.5">
            {socketStatus === 'connected' ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            ) : null}
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                socketStatus === 'connected'
                  ? 'bg-emerald-500'
                  : socketStatus === 'connecting'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
              }`}
            />
          </span>
          {socketStatus === 'connected'
            ? 'Live Sync Active'
            : socketStatus === 'connecting'
              ? 'Connecting…'
              : 'Sync Offline'}
        </div>

        <Link href="/admin/activity" className="relative">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 ring-2 ring-slate-100 transition-all hover:ring-primary/20"
              >
                <Avatar className="h-9 w-9">
                  {user?.avatar ? <AvatarImage src={user.avatar} alt={initials} /> : null}
                  <AvatarFallback className="bg-primary text-xs font-bold text-white select-none">
                    {initials || 'AD'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="mt-1 w-56 border-slate-200/80 shadow-md">
            <div className="px-3 py-2 text-left">
              <p className="text-xs font-bold text-slate-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={() => router.push('/admin')}
              className="cursor-pointer py-2 text-xs text-slate-700"
            >
              Admin overview
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer py-2 text-xs text-destructive hover:bg-red-50/50"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
