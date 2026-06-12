'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Bookmark,
  Kanban,
  Bell,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/constants';

const iconMap = {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Bookmark,
  Kanban,
  Bell,
  Settings,
  Sparkles,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">CareerTrack</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(`${item.href}/`) &&
              !(
                item.href === '/jobs' &&
                (pathname.startsWith('/jobs/saved') || pathname.startsWith('/jobs/recommended'))
              ));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <p className="text-xs font-medium text-primary">Pro Tip</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete your profile to get better job matches.
          </p>
        </div>
      </div>
    </aside>
  );
}
