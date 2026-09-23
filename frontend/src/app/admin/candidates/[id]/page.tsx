'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { adminService } from '@/services/admin.service';
import { formatAdminDate, StageBadge } from '@/components/admin/admin-format';
import { ManageApplicationDialog } from '@/components/admin/manage-application-dialog';
import { AdminApplication } from '@/types/admin';

export default function AdminCandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidate', id],
    queryFn: () => adminService.getCandidate(id),
    enabled: Boolean(id),
  });

  const toggle = useMutation({
    mutationFn: (isActive: boolean) => adminService.updateCandidate(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-candidate', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <PageHeader title="Candidate" description="This candidate record could not be loaded." />
        <Link href="/admin/candidates" className="text-xs font-bold text-primary">
          Back to candidates
        </Link>
      </div>
    );
  }

  const { candidate, profile } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${candidate.firstName} ${candidate.lastName}`}
        description={candidate.email}
        action={
          <div className="flex gap-2">
            <ButtonLinkBack />
            <Button
              variant="outline"
              size="sm"
              disabled={toggle.isPending}
              onClick={() => toggle.mutate(!candidate.isActive)}
            >
              {candidate.isActive ? 'Deactivate account' : 'Activate account'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Summary label="Status" value={candidate.isActive ? 'Active' : 'Inactive'} />
        <Summary label="Plan" value={candidate.subscriptionPlan} />
        <Summary label="Applications" value={String(data.applications.length)} />
        <Summary label="Saved jobs" value={String(data.savedJobs.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200/80 bg-white shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Profile</CardTitle>
            <CardDescription className="text-[11px] text-slate-400">
              {profile?.professionalProfileCompleted ? 'Onboarding complete' : 'Onboarding incomplete'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <>
                <div>
                  <p className="text-2xl font-extrabold text-slate-800">{profile.completionScore}%</p>
                  <Progress value={profile.completionScore} className="mt-2 h-2" />
                </div>
                <Detail label="Headline" value={profile.headline || profile.designation} />
                <Detail label="Company" value={profile.currentCompany} />
                <Detail label="Location" value={profile.location} />
                <Detail label="Experience" value={`${profile.totalExperienceYears || 0} years`} />
                <Detail label="Open to work" value={profile.openToWork ? 'Yes' : 'No'} />
                {profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 10).map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Link href={`/admin/profiles/${candidate.id}`} className="text-xs font-bold text-primary">
                  Open full profile
                </Link>
              </>
            ) : (
              <p className="text-xs text-slate-500">This candidate has not created a profile yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.applications.length > 0 ? (
              data.applications.map((application) => (
                <div key={application.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{application.jobTitle}</p>
                    <p className="text-[10px] text-slate-500">
                      {application.company} · {formatAdminDate(application.appliedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StageBadge stage={application.stage} />
                    <Button variant="outline" size="sm" onClick={() => setSelected(application)}>
                      Manage
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No applications.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Saved jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.savedJobs.length > 0 ? (
              data.savedJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs font-bold text-slate-800">{job.jobTitle}</p>
                  <p className="text-[10px] text-slate-500">
                    {job.company} · Saved {formatAdminDate(job.savedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No saved jobs.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">Related activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activity.length > 0 ? (
              data.activity.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <p className="text-[10px] text-slate-500">{item.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{formatAdminDate(item.at)}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ManageApplicationDialog
        application={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-candidate', id] })}
      />
    </div>
  );
}

function ButtonLinkBack() {
  return (
    <Link
      href="/admin/candidates"
      className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[0.8rem] font-medium text-slate-700 hover:bg-slate-50"
    >
      All candidates
    </Link>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="mt-1 text-lg font-extrabold capitalize text-slate-800">{value}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="text-xs font-semibold text-slate-700">{value || '—'}</p>
    </div>
  );
}
