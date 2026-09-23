'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { APPLICATION_STAGES } from '@/constants';
import { adminService } from '@/services/admin.service';
import { ApplicationStage } from '@/types';
import { AdminApplication } from '@/types/admin';
import { formatAdminDate } from '@/components/admin/admin-format';

export function ManageApplicationDialog({
  application,
  open,
  onOpenChange,
  onSaved,
}: {
  application: AdminApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [stage, setStage] = useState<ApplicationStage>('applied');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!application) return;
    setStage(application.stage);
    setNote('');
    setFeedback(application.recruiterFeedback || '');
    setError('');
  }, [application]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!application) throw new Error('Application is missing');
      return adminService.updateApplication(application.id, {
        stage,
        note: note.trim() || undefined,
        recruiterFeedback: feedback,
      });
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => {
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(message || 'Unable to update this application');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">Manage application</DialogTitle>
        </DialogHeader>
        {application ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-sm font-bold text-slate-800">{application.jobTitle}</p>
              <p className="text-xs text-slate-500">{application.company}</p>
              <p className="mt-2 text-xs font-semibold text-slate-700">
                {application.candidateName}
                {application.candidateEmail ? ` · ${application.candidateEmail}` : ''}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Applied {formatAdminDate(application.appliedAt)}
                {application.resumeTitle ? ` · ${application.resumeTitle}` : ''}
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Stage</span>
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value as ApplicationStage)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                {APPLICATION_STAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Timeline note
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Optional note for this update"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Recruiter feedback
              </span>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
              />
            </label>

            {application.timeline.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">History</p>
                <div className="max-h-40 space-y-2 overflow-auto">
                  {application.timeline
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div key={`${entry.date}-${index}`} className="rounded-lg border border-slate-100 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-700">
                          {entry.stage} · {formatAdminDate(entry.date)}
                        </p>
                        {entry.note ? <p className="text-[11px] text-slate-500">{entry.note}</p> : null}
                        {entry.updatedBy ? (
                          <p className="text-[10px] text-slate-400">{entry.updatedBy}</p>
                        ) : null}
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
