'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { notificationsService } from '@/services/notifications.service';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(),
    retry: false,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
        action={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()}>
              <CheckCheck className="mr-2 h-4 w-4" />Mark all read
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! New updates will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n._id} className={cn('border-border/40', !n.isRead && 'bg-primary/5 border-primary/20')}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0', n.isRead ? 'bg-transparent' : 'bg-primary')} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    <Badge variant="outline" className="text-xs">{n.type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
