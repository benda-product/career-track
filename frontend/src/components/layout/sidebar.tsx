'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
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
  ClipboardCheck,
  Award,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  ScanSearch,
  PlayCircle,
  History,
  BarChart3,
  Medal,
  ListChecks,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
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
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/profile', label: 'My Profile', icon: User },
    ],
  },
  {
    id: 'resume-builder',
    title: 'Resume Builder',
    icon: FileText,
    collapsible: true,
    items: [
      {
        href: '/resume',
        label: 'My Resumes',
        icon: FileText,
        match: (pathname) => {
          if (pathname === '/resume') return true;
          if (!pathname.startsWith('/resume/')) return false;
          const otherResumeRoutes = ['/resume/create', '/resume/ats'];
          return !otherResumeRoutes.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`)
          );
        },
      },
      {
        href: '/resume/create',
        label: 'Create Resume',
        icon: PlusCircle,
        match: (pathname) =>
          pathname === '/resume/create' || pathname.startsWith('/resume/create/'),
      },
      {
        href: '/resume/ats',
        label: 'Check ATS Score',
        icon: ScanSearch,
        match: (pathname) =>
          pathname === '/resume/ats' || pathname.startsWith('/resume/ats/'),
      },
    ],
  },
  {
    id: 'skillcheck',
    title: 'Skillcheck',
    icon: ClipboardCheck,
    collapsible: true,
    items: [
      { href: '/skill-check/take', label: 'Take Test', icon: PlayCircle },
      {
        href: '/skill-check/my-tests',
        label: 'Test History',
        icon: History,
        match: (pathname) =>
          pathname === '/skill-check/my-tests' || pathname.startsWith('/skill-check/my-tests/'),
      },
      {
        href: '/skill-check',
        label: 'View Result',
        icon: BarChart3,
        match: (pathname) =>
          pathname === '/skill-check' ||
          (pathname.startsWith('/skill-check/') &&
            !['/skill-check/take', '/skill-check/my-tests', '/skill-check/certificates'].includes(
              pathname
            )),
      },
      { href: '/skill-check/certificates', label: 'My Certificate', icon: Medal },
    ],
  },
  {
    id: 'courses',
    title: 'Courses',
    icon: BookOpen,
    collapsible: false,
    items: [
      {
        href: '/courses',
        label: 'Browse Courses',
        icon: BookOpen,
        match: (pathname) => pathname === '/courses' || pathname.startsWith('/courses/'),
      },
    ],
  },
  {
    id: 'job-pipeline',
    title: 'Job pipeline',
    icon: Briefcase,
    collapsible: false,
    items: [
      {
        href: '/jobs',
        label: 'Job Search',
        icon: Briefcase,
        match: (pathname) =>
          pathname === '/jobs' ||
          (pathname.startsWith('/jobs/') &&
            !pathname.startsWith('/jobs/saved') &&
            !pathname.startsWith('/jobs/recommended')),
      },
      { href: '/jobs/saved', label: 'Saved Jobs', icon: Bookmark },
      { href: '/jobs/recommended', label: 'Recommended Jobs', icon: Sparkles },
      {
        href: '/applications/status',
        label: 'Application Status',
        icon: ListChecks,
        match: (pathname) =>
          pathname === '/applications/status' || pathname.startsWith('/applications/status/'),
      },
      {
        href: '/applications',
        label: 'Job Tracker',
        icon: Kanban,
        match: (pathname) =>
          pathname === '/applications' ||
          (pathname.startsWith('/applications/') && !pathname.startsWith('/applications/status')),
      },
    ],
  },
  {
    id: 'system',
    title: 'System',
    icon: Settings,
    collapsible: false,
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem) {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isGroupActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isItemActive(pathname, item));
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.filter((g) => g.collapsible).map((g) => [g.id, true]))
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of NAV_GROUPS) {
        if (group.collapsible && isGroupActive(pathname, group)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={cn(
        'flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-sm h-screen sticky top-0',
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-slate-100 px-6 justify-between bg-slate-50/50">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <CareerTrackLogo size="md" className="h-8 text-primary" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = group.collapsible ? (openGroups[group.id] ?? false) : true;
          const groupActive = isGroupActive(pathname, group);

          return (
            <div key={group.id} className="space-y-1">
              {group.collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
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
                        key={item.href + item.label}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all relative group',
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
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <Award className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[11px] font-bold text-slate-800">Profile Strength</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div className="h-full bg-primary rounded" style={{ width: '75%' }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>75% Complete</span>
            <Link
              href="/profile/edit"
              className="text-primary hover:underline flex items-center gap-0.5"
            >
              Improve <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
