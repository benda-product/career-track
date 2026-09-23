'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { APPLICATION_STAGES } from '@/constants';
import { adminService } from '@/services/admin.service';
import { AdminPager } from '@/components/admin/admin-pager';
import { AdminSearchForm } from '@/components/admin/admin-search-form';
import { useAdminQueryState } from '@/components/admin/use-admin-query';
import { formatAdminDate, StageBadge } from '@/components/admin/admin-format';
import { ManageApplicationDialog } from '@/components/admin/manage-application-dialog';
import { AdminApplication } from '@/types/admin';

export default function AdminApplicationsPage() {
  const queryClient = useQueryClient();
  const { q, page, stage, update } = useAdminQueryState();
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-applications', q, page, stage],
    queryFn: () => adminService.getApplications({ search: q, page, limit: 12, stage }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Every job application submitted through Career Track. Update stage, notes, and recruiter feedback."
        action={
          <AdminSearchForm
            key={q}
            initialQuery={q}
            placeholder="Search candidate, role, or company"
            onSearch={(query) => update({ q: query, page: 1 })}
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!stage} label="All stages" onClick={() => update({ stage: '', page: 1 })} />
        {APPLICATION_STAGES.map((item) => (
          <FilterChip
            key={item.value}
            active={stage === item.value}
            label={item.label}
            onClick={() => update({ stage: item.value, page: 1 })}
          />
        ))}
      </div>

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
              <table className="w-full min-w-[860px] text-left">
                <thead className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Stage</th>
                    <th className="px-3 py-3">Applied</th>
                    <th className="px-5 py-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((application) => (
                    <tr key={application.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/admin/candidates/${application.userId}`} className="text-xs font-bold text-slate-800 hover:text-primary">
                          {application.candidateName}
                        </Link>
                        <p className="text-[10px] text-slate-500">{application.candidateEmail}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700">
                        {application.jobTitle}
                        <p className="text-[10px] text-slate-400">{application.company}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StageBadge stage={application.stage} />
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{formatAdminDate(application.appliedAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(application)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!data?.items.length ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                        No applications match this view.
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

      <ManageApplicationDialog
        application={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
          queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
        }}
      />
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${
        active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}
