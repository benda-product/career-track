'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import {
  Activity,
  Bookmark,
  Briefcase,
  ChevronDown,
  LayoutDashboard,
  Mail,
  Shield,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';
import { EcosystemAdminConsoleSwitcher } from '@/components/admin/ecosystem-admin-console-switcher';

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavGroup = {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  collapsible: boolean;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    icon: LayoutDashboard,
    collapsible: true,
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/candidates', label: 'Candidates', icon: Users },
      { href: '/admin/profiles', label: 'Profiles', icon: UserRound },
    ],
  },
  {
    id: 'job-pipeline',
    title: 'Job pipeline',
    icon: Briefcase,
    collapsible: false,
    items: [
      { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/admin/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
      { href: '/admin/applications', label: 'Applications', icon: Shield },
    ],
  },
  {
    id: 'system',
    title: 'System',
    icon: Activity,
    collapsible: false,
    items: [
      { href: '/admin/activity', label: 'Activity', icon: Activity },
      { href: '/admin/email-previews', label: 'Email Previews', icon: Mail },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isGroupActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isItemActive(pathname, item));
}

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.filter((group) => group.collapsible).map((group) => [group.id, true]))
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of NAV_GROUPS) {
        if (group.collapsible && isGroupActive(pathname, group)) next[group.id] = true;
      }
      return next;
    });
  }, [pathname]);

  return (
    <aside
      className={cn(
        'flex h-screen w-64 flex-col border-r border-slate-200/80 bg-white shadow-sm sticky top-0',
        className
      )}
    >
      <div className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50 px-4">
        <Link href="/admin" className="min-w-0 transition-opacity hover:opacity-90">
          <CareerTrackLogo size="md" className="h-8 text-primary" />
        </Link>
      </div>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
        {NAV_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = group.collapsible ? (openGroups[group.id] ?? false) : true;
          const groupActive = isGroupActive(pathname, group);

          return (
            <div key={group.id} className="space-y-1">
              {group.collapsible ? (
                <button
                  type="button"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors',
                    groupActive ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">{group.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform',
                      isOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>
              ) : (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </h4>
              )}

              {isOpen && (
                <div className={cn('space-y-0.5', group.collapsible && 'pl-1')}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(pathname, item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                          group.collapsible && 'pl-5',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-[inset_3px_0_0_0_var(--color-primary)]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        <span>{item.label}</span>
                        {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-[11px] font-bold text-slate-800">Admin console</p>
          <EcosystemAdminConsoleSwitcher currentId="career-track" />
        </div>
      </div>
    </aside>
  );
}
