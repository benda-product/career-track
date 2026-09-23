'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminService } from '@/services/admin.service';
import { AdminPager } from '@/components/admin/admin-pager';
import { AdminSearchForm } from '@/components/admin/admin-search-form';
import { useAdminQueryState } from '@/components/admin/use-admin-query';
import { formatAdminDate } from '@/components/admin/admin-format';
import { JobDescriptionHtml } from '@/components/jobs/job-description-html';
import { AdminJob } from '@/types/admin';

export default function AdminJobsPage() {
  const { q, page, update } = useAdminQueryState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', q, page],
    queryFn: () => adminService.getJobs({ search: q, page, limit: 12 }),
  });
  const detail = useQuery({
    queryKey: ['admin-job', selectedId],
    queryFn: () => adminService.getJob(selectedId!),
    enabled: Boolean(selectedId),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Published Career Track jobs from the Talent Desk catalog."
        action={
          <AdminSearchForm
            key={q}
            initialQuery={q}
            placeholder="Search job title or company"
            onSearch={(query) => update({ q: query, page: 1 })}
          />
        }
      />

      {data?.unavailable ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-xs font-medium text-amber-800">
            The job catalog is unavailable right now. Candidate, profile, application, and saved-job data is still available.
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Posted</th>
                    <th className="px-5 py-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((job) => (
                    <tr key={job.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <p className="text-xs font-bold text-slate-800">{job.title}</p>
                        <p className="text-[10px] text-slate-500">{job.company}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">{job.location || '—'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {job.employmentType || (job.remote ? 'Remote' : job.hybrid ? 'Hybrid' : '—')}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{formatAdminDate(job.postedAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedId(job.id)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!data?.items.length ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                        No jobs match this search.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
          {data ? (
            <div className="px-5 pb-5">
              <AdminPager page={data.page} totalPages={data.totalPages} total={data.total} onPage={(next) => update({ page: next })} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <JobDetailDialog job={detail.data} open={Boolean(selectedId)} loading={detail.isLoading} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}

function JobDetailDialog({
  job,
  open,
  loading,
  onOpenChange,
}: {
  job?: AdminJob;
  open: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">{job?.title || 'Job'}</DialogTitle>
        </DialogHeader>
        {loading || !job ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500">
              {job.company}
              {job.location ? ` · ${job.location}` : ''}
              {job.salary ? ` · ${job.salary}` : ''}
            </p>
            {job.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
            <JobDescriptionHtml html={job.description} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
