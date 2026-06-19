'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCheck,
  Check,
  Trophy,
  Briefcase,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsService } from '@/services/notifications.service';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type FilterType = 'all' | 'unread' | 'applications' | 'skill_check';

function isSkillCheckNotification(notification: {
  title?: string;
  data?: Record<string, unknown>;
}) {
  return (
    notification.title?.toLowerCase().includes('skill check') ||
    Boolean(notification.data?.assignmentId)
  );
}

function isApplicationUpdateNotification(notification: {
  type?: string;
  data?: Record<string, unknown>;
}) {
  return notification.type === 'application_update' || Boolean(notification.data?.applicationId);
}

function getNotificationIcon(n: { title?: string; type?: string; data?: Record<string, unknown> }) {
  if (isSkillCheckNotification(n)) {
    return {
      icon: Trophy,
      bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
    };
  }
  if (isApplicationUpdateNotification(n)) {
    return {
      icon: Briefcase,
      bg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400',
    };
  }
  return {
    icon: Bell,
    bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterType>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(),
    retry: false,
  });

  // Mutation to mark all notifications as read
  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Mutation to mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  // Filter list locally based on selected tab trigger
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread') return !n.isRead;
      if (activeTab === 'applications') return isApplicationUpdateNotification(n);
      if (activeTab === 'skill_check') return isSkillCheckNotification(n);
      return true;
    });
  }, [notifications, activeTab]);

  const handleMarkSingleRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markReadMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `You have ${unreadCount} unread candidate alerts` : 'All caught up!'}
        action={
          unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => markAllMutation.mutate()}
              className="border-border/80 text-foreground hover:bg-muted/30 font-semibold"
            >
              <CheckCheck className="mr-2 h-4 w-4 text-primary" />
              Mark all read
            </Button>
          )
        }
      />

      {/* Tabs Filter Header Bar */}
      <div className="flex items-center p-1 bg-muted rounded-xl w-fit border border-border/50">
        {([
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'applications', label: 'Applications' },
          { id: 'skill_check', label: 'Skill Tests' }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-all duration-200 uppercase tracking-wider cursor-pointer",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="border-border/60 shadow-sm bg-muted/20">
          <CardContent className="py-16 text-center max-w-sm mx-auto space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <Bell className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">No alerts found</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                {activeTab === 'unread'
                  ? "You don't have any unread notifications at the moment."
                  : activeTab === 'applications'
                    ? "You don't have any application update notifications yet."
                    : activeTab === 'skill_check'
                      ? "You don't have any skill test notification alerts yet."
                      : "All caught up! New updates regarding assessments, applications, and scoring will appear here."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filteredNotifications.map((n) => {
              const skillCheck = isSkillCheckNotification(n);
              const applicationUpdate = isApplicationUpdateNotification(n);
              const clickable = skillCheck || applicationUpdate;
              const typeIcon = getNotificationIcon(n);
              const Icon = typeIcon.icon;

              // Pass visual accents
              const leftBorderClass = n.isRead 
                ? 'before:bg-muted-foreground/20' 
                : 'before:bg-primary';

              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={cn(
                      'relative overflow-hidden border-border/80 shadow-sm pl-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 transition-all duration-200',
                      leftBorderClass,
                      !n.isRead && 'bg-primary/5 border-primary/20',
                      clickable && 'cursor-pointer hover:border-primary/45 hover:shadow-md'
                    )}
                    onClick={() => {
                      if (skillCheck) router.push('/skill-check');
                      else if (applicationUpdate) router.push('/applications');
                    }}
                  >
                    <CardContent className="flex items-start gap-4 p-5">
                      {/* Alert Icon indicator */}
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5', typeIcon.bg)}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>

                      {/* Main Message block */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-foreground text-sm tracking-tight leading-snug">
                            {n.title}
                          </h4>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-background px-1.5 py-0.5 border-border">
                            {n.type.replace('_', ' ')}
                          </Badge>
                          {!n.isRead && (
                            <span className="flex h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{n.message}</p>
                        
                        <div className="flex items-center justify-between gap-4 pt-1">
                          {/* Completed time distance */}
                          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>

                          {/* Quick navigation redirects */}
                          <div className="flex items-center gap-3">
                            {!n.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkSingleRead(e, n._id)}
                                className="h-7 text-[10px] font-bold text-primary hover:text-primary/95 hover:bg-primary/5 px-2.5 rounded-lg border border-primary/10"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark read
                              </Button>
                            )}
                            {skillCheck ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                                Open Skill Check
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            ) : applicationUpdate ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                                View Applications
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
