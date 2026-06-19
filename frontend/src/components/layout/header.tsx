'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Search, Settings, User, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';

export function Header() {
  const router = useRouter();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } finally {
      clearAuth();
      router.push('/auth/login');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/jobs/search?q=${encodeURIComponent(search)}`);
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'CT';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 backdrop-blur-md lg:px-6 shadow-sm">
      {/* Mobile Drawer and Page Title Area */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" className="lg:hidden border-slate-200 hover:bg-slate-50 text-slate-600">
                <Menu className="h-4 w-4" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0">
            {/* Override the default hidden style for mobile drawer */}
            <Sidebar className="flex" />
          </SheetContent>
        </Sheet>
        
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
          <Sparkles className="h-3 w-3" /> Candidate Portal
        </span>
      </div>

      {/* Global Command Search Container */}
      <form onSubmit={handleSearch} className="flex flex-1 max-w-md mx-4">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search matching jobs, skills..."
            className="w-full pl-9 pr-12 h-9 text-xs rounded-lg bg-slate-50 border-slate-200/80 focus-visible:ring-primary/20 text-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 pointer-events-none">
            <kbd className="h-4 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1 font-mono text-[9px] font-bold text-slate-400 flex">
              ⌘K
            </kbd>
          </div>
        </div>
      </form>

      {/* Right Actions Block */}
      <div className="flex items-center gap-3">
        {/* Real-time Connection status indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 text-[10px] font-bold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          Live Sync Active
        </div>

        {/* Notifications Bell */}
        <Link href="/notifications" className="relative">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Button>
        </Link>

        {/* Profile Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-slate-100 hover:ring-primary/20 transition-all p-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-white font-bold text-xs select-none">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 mt-1 border-slate-200/80 shadow-md">
            <div className="px-3 py-2 text-left">
              <p className="text-xs font-bold text-slate-800">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="text-xs text-slate-700 py-2 cursor-pointer">
              <User className="mr-2 h-3.5 w-3.5 text-slate-400" />Candidate Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="text-xs text-slate-700 py-2 cursor-pointer">
              <Settings className="mr-2 h-3.5 w-3.5 text-slate-400" />Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem onClick={handleLogout} className="text-xs text-destructive py-2 cursor-pointer hover:bg-red-50/50">
              <LogOut className="mr-2 h-3.5 w-3.5" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
