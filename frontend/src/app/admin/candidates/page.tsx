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

export default function AdminCandidatesPage() {
  const queryClient = useQueryClient();
  const { q, page, update } = useAdminQueryState();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidates', q, page],
    queryFn: () => adminService.getCandidates({ search: q, page, limit: 12 }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateCandidate(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Every Career Track candidate account, with profile progress and access status."
        action={<AdminSearchForm key={q} initialQuery={q} placeholder="Search name or email" onSearch={(query) => update({ q: query, page: 1 })} />}
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
                    <th className="px-3 py-3">Profile</th>
                    <th className="px-3 py-3">Plan</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="px-5 py-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((candidate) => (
                    <tr key={candidate.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/admin/candidates/${candidate.id}`} className="text-xs font-bold text-slate-800 hover:text-primary">
                          {candidate.firstName} {candidate.lastName}
                        </Link>
                        <p className="text-[10px] text-slate-500">{candidate.email}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {candidate.profile ? `${candidate.profile.completionScore}%` : 'No profile'}
                        <p className="text-[10px] text-slate-400">
                          {candidate.profile?.designation || candidate.profile?.headline || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold capitalize text-slate-700">
                        {candidate.subscriptionPlan}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold">
                        <span className={candidate.isActive ? 'text-emerald-700' : 'text-rose-600'}>
                          {candidate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{formatAdminDate(candidate.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggle.isPending}
                          onClick={() => toggle.mutate({ id: candidate.id, isActive: !candidate.isActive })}
                        >
                          {candidate.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!data?.items.length ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-xs text-slate-500">
                        No candidates match this search.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
          {data ? (
            <div className="px-5 pb-5">
              <AdminPager
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                onPage={(next) => update({ page: next })}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
