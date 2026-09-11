'use client';

import { useMemo } from 'react';
import { looksLikeHtml, sanitizeJobDescriptionHtml, stripHtml } from '@/lib/job-content';
import { cn } from '@/lib/utils';

type Props = {
  html?: string | null;
  className?: string;
};

/** Renders stored job description HTML (or plain text fallback for older posts). */
export function JobDescriptionHtml({ html, className }: Props) {
  const safeHtml = useMemo(() => {
    if (!html?.trim()) return '';
    if (!looksLikeHtml(html)) return '';
    return sanitizeJobDescriptionHtml(html);
  }, [html]);

  if (!html?.trim()) return null;

  if (!safeHtml) {
    const plain = stripHtml(html) || html.trim();
    return <p className={cn('text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap', className)}>{plain}</p>;
  }

  return (
    <div
      className={cn(
        'job-desc-html prose prose-sm max-w-none text-muted-foreground [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_table]:w-full [&_td]:border [&_td]:border-border/60 [&_td]:p-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
