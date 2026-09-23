'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/admin.service';
import { formatAdminDate } from '@/components/admin/admin-format';

export default function AdminProfileDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-profile', userId],
    queryFn: () => adminService.getProfile(userId),
    enabled: Boolean(userId),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-40" />;

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <PageHeader title="Profile" description="This candidate does not have a Career Track profile yet." />
        <Link href="/admin/profiles" className="text-xs font-bold text-primary">
          Back to profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.candidateName}
        description={data.headline || data.email}
        action={
          <Link
            href={`/admin/candidates/${data.userId}`}
            className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[0.8rem] font-medium text-slate-700"
          >
            Candidate record
          </Link>
        }
      />

      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-slate-800">{data.completionScore}%</p>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Completion score</p>
            </div>
            <p className="text-xs font-semibold text-slate-500">Updated {formatAdminDate(data.updatedAt)}</p>
          </div>
          <Progress value={data.completionScore} className="h-2" />
          <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Email" value={data.email} />
            <Field label="Phone" value={data.phone} />
            <Field label="Location" value={data.location} />
            <Field label="Company" value={data.currentCompany} />
            <Field label="Designation" value={data.designation} />
            <Field label="Experience" value={`${data.totalExperienceYears || 0} years`} />
            <Field label="Employment" value={data.employmentStatus?.replaceAll('_', ' ')} />
            <Field label="Open to work" value={data.openToWork ? 'Yes' : 'No'} />
          </div>
          {data.summary ? <p className="pt-2 text-xs leading-relaxed text-slate-600">{data.summary}</p> : null}
          {data.linkedinProfile ? (
            <a href={data.linkedinProfile} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary">
              LinkedIn profile
            </a>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.experience.length > 0 ? (
              data.experience.map((item, index) => (
                <div key={`${item.company}-${index}`} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs font-bold text-slate-800">{item.title || 'Role'}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.company || 'Company'} · {formatAdminDate(item.startDate)} – {item.current ? 'Present' : formatAdminDate(item.endDate)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No experience listed.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Education and skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.education.map((item, index) => (
              <div key={`${item.institution}-${index}`}>
                <p className="text-xs font-bold text-slate-800">{item.degree || 'Degree'}</p>
                <p className="text-[10px] text-slate-500">
                  {item.institution} {item.field ? `· ${item.field}` : ''}
                </p>
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
            {data.softSkills.length > 0 ? (
              <p className="text-[11px] text-slate-500">Soft skills: {data.softSkills.join(', ')}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="text-xs font-semibold text-slate-700">{value || '—'}</p>
    </div>
  );
}
