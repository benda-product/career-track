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

export default function AdminProfilesPage() {
  const { q, page, update } = useAdminQueryState();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-profiles', q, page],
    queryFn: () => adminService.getProfiles({ search: q, page, limit: 12 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profiles"
        description="Candidate profiles stored in Career Track, including completion and work preferences."
        action={
          <AdminSearchForm
            key={q}
            initialQuery={q}
            placeholder="Search headline, skill, or candidate"
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
              <table className="w-full min-w-[820px] text-left">
                <thead className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Score</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-5 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((profile) => (
                    <tr key={profile.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/admin/profiles/${profile.userId}`} className="text-xs font-bold text-slate-800 hover:text-primary">
                          {profile.candidateName}
                        </Link>
                        <p className="text-[10px] text-slate-500">{profile.email || '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {profile.designation || profile.headline || '—'}
                        <p className="text-[10px] text-slate-400">{profile.currentCompany || '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">{profile.location || '—'}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-700">{profile.completionScore}%</td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {profile.openToWork ? 'Open to work' : 'Not looking'}
                        <p className="text-[10px] text-slate-400">
                          {profile.professionalProfileCompleted ? 'Onboarding complete' : 'Onboarding open'}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatAdminDate(profile.updatedAt)}</td>
                    </tr>
                  ))}
                  {!data?.items.length ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-xs text-slate-500">
                        No profiles match this search.
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
