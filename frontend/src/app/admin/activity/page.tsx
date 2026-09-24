'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/admin.service';
import { AdminPager } from '@/components/admin/admin-pager';
import { AdminSearchForm } from '@/components/admin/admin-search-form';
import { useAdminQueryState } from '@/components/admin/use-admin-query';
import { formatAdminDate } from '@/components/admin/admin-format';

const KIND_LABELS: Record<string, string> = {
  application: 'Application',
  saved_job: 'Saved job',
  job_view: 'Job view',
  job_match: 'Job match',
  application_update: 'Application update',
  resume_score: 'Resume',
  interview_invite: 'Interview',
  profile_suggestion: 'Profile',
  recruiter_message: 'Recruiter message',
  system: 'System',
};

export default function AdminActivityPage() {
  const { q, page, update } = useAdminQueryState();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity', q, page],
    queryFn: () => adminService.getActivity({ search: q, page, limit: 15 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Recent applications, saved jobs, job views, and candidate notifications."
        action={
          <AdminSearchForm
            key={q}
            initialQuery={q}
            placeholder="Search activity"
            onSearch={(query) => update({ q: query, page: 1 })}
          />
        }
      />
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-3 p-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16" />)
          ) : (data?.items || []).length > 0 ? (
            data!.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-primary uppercase">
                    {KIND_LABELS[item.kind] || item.kind.replaceAll('_', ' ')}
                  </p>
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.message}</p>
                  {item.actor ? <p className="mt-1 text-[10px] font-semibold text-slate-400">{item.actor}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400">{formatAdminDate(item.at)}</p>
                  {item.href ? (
                    <Link href={item.href} className="text-[10px] font-bold text-primary">
                      Open
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-slate-500">No activity matches this search.</p>
          )}
          {data ? (
            <AdminPager page={data.page} totalPages={data.totalPages} total={data.total} onPage={(next) => update({ page: next })} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
