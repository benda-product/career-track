'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Loader2, Plus } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';

import { ResumeFilters } from '@/components/resume/ResumeFilters';
import { ResumeCard } from '@/components/resume/ResumeCard';
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
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'latest' | 'highest'>('latest');
  const [visibility, setVisibility] = useState<'all' | 'visible' | 'hidden'>('all');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
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
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetTitle('');
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

  function requestDelete(resume: ResumeItem) {
    const id = getResumeId(resume);
    if (!id) return;

    setDeleteError('');
    setDeleteTargetId(id);
    setDeleteTargetTitle(resume.title || 'this resume');
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    setActionError('');
    setDeleteError('');
    setDeletingId(deleteTargetId);
    deleteMutation.mutate(deleteTargetId);
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

  async function handleDuplicate(resume: ResumeItem) {
    const id = getResumeId(resume);
    if (!id) return;

    setActionError('');
    setDeleteError('');
    setDuplicatingId(id);

    try {
      const full = (await resumeService.getResume(id)) as unknown as Record<string, unknown>;
      const originalTitle = (full?.title as string | undefined) || resume.title || 'Resume';

      const payload: Record<string, unknown> = {
        title: `${originalTitle} (Copy)`,
        personalInfo: full?.personalInfo,
        education: full?.education,
        experience: full?.experience,
        projects: full?.projects,
        skills: full?.skills,
        skillDetails: (full as any)?.skillDetails,
        extras: (full as any)?.extras,
        targetJob: (full as any)?.targetJob,
        template: (full?.template as string | undefined) || resume.template || 'modern',
        templateStyle: (full as any)?.templateStyle,
        isViewable: false,
      };

      const created = (await resumeService.createResume(payload)) as unknown as Record<string, unknown>;
      const createdId = getResumeId(created as unknown as ResumeItem);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });

      if (createdId) await openEdit(createdId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to duplicate resume');
    } finally {
      setDuplicatingId(null);
    }
  }

  const resumeList = (resumes as ResumeItem[] | undefined) || [];

  const toCompletionPercent = (resume: ResumeItem) => {
    const checks = [
      Boolean(resume.title && resume.title.trim().length > 0),
      (resume.skills?.length || 0) > 0,
      (resume.experience?.length || 0) > 0,
      (resume.education?.length || 0) > 0,
      Boolean((resume.personalInfo as any)?.summary?.trim?.()),
      (resume.projects?.length || 0) > 0,
    ];
    const total = checks.length || 1;
    const done = checks.filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  function resetFilters() {
    setQuery('');
    setSort('latest');
    setVisibility('all');
  }

  const stats = useMemo(() => {
    const totalResumes = resumeList.length;
    const visibleResumes = resumeList.reduce((acc, r) => {
      const id = getResumeId(r);
      return acc + (viewableResumeId === id ? 1 : 0);
    }, 0);

    const scored = resumeList
      .map((r) => (typeof r.score === 'number' ? r.score : null))
      .filter((v): v is number => typeof v === 'number');
    const averageAtsScore = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;

    const completionValues = resumeList.map((r) => toCompletionPercent(r));
    const averageCompletion = completionValues.length
      ? Math.round(completionValues.reduce((a, b) => a + b, 0) / completionValues.length)
      : 0;

    return { totalResumes, visibleResumes, averageAtsScore, averageCompletion };
  }, [resumeList, viewableResumeId]);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = resumeList
      .map((resume, i) => {
        const resumeId = getResumeId(resume);
        const isVisible = viewableResumeId === resumeId;
        return {
          resume,
          resumeId,
          isVisible,
          index: i,
          completionPercent: toCompletionPercent(resume),
        };
      })
      .filter((x) => Boolean(x.resumeId));

    const filtered = items.filter((x) => {
      if (visibility === 'visible' && !x.isVisible) return false;
      if (visibility === 'hidden' && x.isVisible) return false;

      if (!q) return true;
      const title = (x.resume.title || '').toLowerCase();
      const skills = (x.resume.skills || []).join(' ').toLowerCase();
      const summary = ((x.resume.personalInfo as any)?.summary || '').toString().toLowerCase();
      return title.includes(q) || skills.includes(q) || summary.includes(q);
    });

    filtered.sort((a, b) => {
      if (sort === 'latest') {
        const aMs = a.resume.updatedAt ? new Date(a.resume.updatedAt as any).getTime() : 0;
        const bMs = b.resume.updatedAt ? new Date(b.resume.updatedAt as any).getTime() : 0;
        return bMs - aMs;
      }

      const aScore = typeof a.resume.score === 'number' ? a.resume.score : -1;
      const bScore = typeof b.resume.score === 'number' ? b.resume.score : -1;
      return bScore - aScore;
    });

    return filtered;
  }, [resumeList, query, sort, visibility, viewableResumeId]);

  const isFilteringEmpty = resumeList.length > 0 && filteredSorted.length === 0 && !isLoading;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <PageHeader
        title="My Resumes"
        description="View and manage your created resumes, track their ATS scores, and toggle recruiter visibility."
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

      <ResumeFilters
        query={query}
        sort={sort}
        visibility={visibility}
        onChangeQuery={setQuery}
        onChangeSort={setSort}
        onChangeVisibility={setVisibility}
        onReset={resetFilters}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTargetId(null);
            setDeleteTargetTitle('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete resume</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{deleteTargetTitle || 'this resume'}</span>.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? <div className="text-sm text-destructive">{deleteError}</div> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={!deleteTargetId || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : !resumeList.length ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Create your first ATS-optimized resume in Resume Builder to start applying for jobs."
          action={{ label: 'Create Resume', onClick: openCreate }}
        />
      ) : isFilteringEmpty ? (
        <EmptyState
          icon={FileText}
          title="No matching resumes"
          description="Try adjusting your search or filters to find your resumes."
          action={{ label: 'Reset filters', onClick: resetFilters }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredSorted.length}</span> of{' '}
              <span className="font-medium text-foreground">{resumeList.length}</span> resumes
            </p>
            <p className="text-xs text-muted-foreground">
              Tip: sort by <span className="font-medium text-foreground">Highest ATS score</span> to prioritize your best CV.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSorted.map(({ resume, resumeId, isVisible, completionPercent, index }) => {
              const isDeleting = deletingId === resumeId && deleteMutation.isPending;
              const isDownloading = downloadingId === resumeId;
              const isTogglingViewable = togglingViewableId === resumeId && viewableMutation.isPending;
              const isDuplicating = duplicatingId === resumeId;

              return (
                <ResumeCard
                  key={resumeId || index}
                  resume={resume}
                  index={index}
                  completionPercent={completionPercent}
                  isViewable={isVisible}
                  isTogglingViewable={isTogglingViewable}
                  isDownloading={isDownloading}
                  isDeleting={isDeleting}
                  isDuplicating={isDuplicating}
                  onView={() => handleView(resume)}
                  onEdit={() => openEdit(resumeId)}
                  onDownload={() => handleDownload(resume)}
                  onDuplicate={() => handleDuplicate(resume)}
                  onDelete={() => requestDelete(resume)}
                  onToggleVisibility={() => toggleViewable(resume)}
                />
              );
            })}
          </div>
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
    </motion.div>
  );
}
