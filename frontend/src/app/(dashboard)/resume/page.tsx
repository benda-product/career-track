'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Plus,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ResumeViewDialog } from '@/components/resume/resume-view-dialog';
import { getResumeId, resumeService, type ResumeItem } from '@/services/resume.service';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';

export default function ResumePage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [deleteError, setDeleteError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewTitle, setViewTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [togglingViewableId, setTogglingViewableId] = useState<string | null>(null);

  const { data: resumes, isLoading, error } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
    enabled: hasHydrated && isAuthenticated,
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    enabled: hasHydrated && isAuthenticated,
  });

  const viewableResumeId = profile?.user?.resumeId || null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeService.deleteResume(id),
    onSuccess: () => {
      setDeleteError('');
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: (err: Error) => {
      setDeleteError(err.message || 'Failed to delete resume');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const viewableMutation = useMutation({
    mutationFn: ({ id, viewable }: { id: string; viewable: boolean }) =>
      resumeService.setViewable(id, viewable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setActionError('');
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to update resume visibility');
    },
    onSettled: () => {
      setTogglingViewableId(null);
    },
  });

  const activatedRef = useRef<string | null>(null);

  useEffect(() => {
    const activateResume = searchParams.get('activateResume');
    if (!activateResume || !hasHydrated || !isAuthenticated) return;
    if (activatedRef.current === activateResume || viewableResumeId === activateResume) return;

    activatedRef.current = activateResume;
    viewableMutation.mutate({ id: activateResume, viewable: true });
    const url = new URL(window.location.href);
    url.searchParams.delete('activateResume');
    window.history.replaceState({}, '', url.pathname);
  }, [searchParams, hasHydrated, isAuthenticated, viewableResumeId]);

  async function handleDelete(resume: ResumeItem) {
    const id = getResumeId(resume);
    if (!id) return;

    const title = resume.title || 'this resume';
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    setDeleteError('');
    setDeletingId(id);
    deleteMutation.mutate(id);
  }

  async function handleDownload(resume: ResumeItem) {
    const id = getResumeId(resume);
    if (!id) return;

    setActionError('');
    setDownloadingId(id);
    try {
      await resumeService.downloadPdf(id, `${resume.title || 'resume'}.pdf`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to download resume');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleView(resume: ResumeItem) {
    const id = getResumeId(resume);
    if (!id) return;

    setViewTitle(resume.title || 'Resume');
    setViewingId(id);
    setViewLoading(true);
    setViewError('');
    setPreviewUrl(null);

    try {
      const url = await resumeService.viewPdf(id);
      setPreviewUrl(url);
    } catch (err: unknown) {
      setViewError(err instanceof Error ? err.message : 'Failed to load resume preview');
    } finally {
      setViewLoading(false);
    }
  }

  function closeView() {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setViewingId(null);
    setViewError('');
  }

  async function toggleViewable(resume: ResumeItem) {
    const id = getResumeId(resume);
    if (!id) return;

    const makeViewable = viewableResumeId !== id;
    setTogglingViewableId(id);
    viewableMutation.mutate({ id, viewable: makeViewable });
  }

  async function openCreate() {
    setActionError('');
    try {
      await resumeService.openInResumeBuilder({
        type: 'create',
        returnUrl: `${window.location.origin}/resume`,
      });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to open Resume Builder');
    }
  }

  async function openEdit(resumeId: string) {
    setActionError('');
    try {
      await resumeService.openInResumeBuilder({
        type: 'edit',
        resumeId,
        returnUrl: `${window.location.origin}/resume`,
      });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to open Resume Builder');
    }
  }

  const resumeList = (resumes as ResumeItem[] | undefined) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume"
        description="Create, preview, and choose which resume recruiters can view when you apply or appear in the talent pool"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Resume
          </Button>
        }
      />

      {(error || deleteError || actionError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message || deleteError || actionError}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !resumeList.length ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Create your first ATS-optimized resume in Resume Builder to start applying for jobs."
          action={{ label: 'Create Resume', onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumeList.map((resume, i) => {
            const resumeId = getResumeId(resume);
            const isDeleting = deletingId === resumeId && deleteMutation.isPending;
            const isDownloading = downloadingId === resumeId;
            const isViewable = viewableResumeId === resumeId;
            const isTogglingViewable = togglingViewableId === resumeId && viewableMutation.isPending;

            return (
              <Card key={resumeId || i} className="border-border/40 bg-card/50 transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{resume.title || `Resume ${i + 1}`}</CardTitle>
                    <div className="flex flex-col items-end gap-1">
                      {resume.score != null && (
                        <Badge variant="secondary">
                          <Star className="mr-1 h-3 w-3" />
                          {resume.score}
                        </Badge>
                      )}
                      {isViewable && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">
                          <Users className="mr-1 h-3 w-3" />
                          Recruiter visible
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleView(resume)} disabled={!resumeId}>
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(resumeId)}>
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={isViewable ? 'default' : 'outline'}
                    onClick={() => toggleViewable(resume)}
                    disabled={!resumeId || isTogglingViewable}
                  >
                    {isTogglingViewable ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-1 h-4 w-4" />
                    )}
                    {isViewable ? 'Hide from recruiters' : 'Visible to recruiters'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(resume)}
                    disabled={!resumeId || isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <ButtonLink href={`/resume/score?id=${resumeId}`} size="sm" variant="outline">
                    Score
                  </ButtonLink>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={!resumeId || isDeleting}
                    onClick={() => handleDelete(resume)}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ResumeViewDialog
        open={Boolean(viewingId)}
        title={viewTitle}
        previewUrl={previewUrl}
        loading={viewLoading}
        error={viewError}
        onClose={closeView}
      />
    </div>
  );
}
