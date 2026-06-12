'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  title: string;
  previewUrl: string | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
};

export function ResumeViewDialog({ open, title, previewUrl, loading, error, onClose }: Props) {
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (previewUrl?.startsWith('blob:')) {
      blobRef.current = previewUrl;
    }
  }, [previewUrl]);

  useEffect(() => {
    if (!open && blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-background shadow-xl"
        role="dialog"
        aria-label={`Preview ${title}`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close preview">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-[420px] flex-1 bg-muted/30 p-2">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading preview…</p>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">{error}</p>
          ) : previewUrl ? (
            <iframe title={title} src={previewUrl} className="h-[70vh] w-full rounded-lg border bg-white" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
