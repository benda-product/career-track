'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/admin.service';
import { AdminPager } from '@/components/admin/admin-pager';
import { AdminSearchForm } from '@/components/admin/admin-search-form';
import { useAdminQueryState } from '@/components/admin/use-admin-query';
import { formatAdminDate } from '@/components/admin/admin-format';

export default function AdminSavedJobsPage() {
  const queryClient = useQueryClient();
  const { q, page, update } = useAdminQueryState();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-saved-jobs', q, page],
    queryFn: () => adminService.getSavedJobs({ search: q, page, limit: 12 }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminService.deleteSavedJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved jobs"
        description="Jobs candidates have bookmarked in Career Track."
        action={
          <AdminSearchForm
            key={q}
            initialQuery={q}
            placeholder="Search candidate, role, or company"
            onSearch={(query) => update({ q: query, page: 1 })}
          />
        }
      />
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
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-3 py-3">Job</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Saved</th>
                    <th className="px-5 py-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((job) => (
                    <tr key={job.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/admin/candidates/${job.userId}`} className="text-xs font-bold text-slate-800 hover:text-primary">
                          {job.candidateName}
                        </Link>
                        <p className="text-[10px] text-slate-500">{job.candidateEmail}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700">
                        {job.jobTitle}
                        <p className="text-[10px] text-slate-400">{job.company}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">{job.location || job.employmentType || '—'}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{formatAdminDate(job.savedAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (window.confirm(`Remove ${job.jobTitle} from ${job.candidateName}'s saved jobs?`)) {
                              remove.mutate(job.id);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!data?.items.length ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                        No saved jobs match this search.
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
    </div>
  );
}
