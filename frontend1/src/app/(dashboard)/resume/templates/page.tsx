'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeService } from '@/services/resume.service';

export default function ResumeTemplatesPage() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['resume-templates'],
    queryFn: resumeService.getTemplates,
    retry: false,
  });

  const items = (templates as { id?: string; name?: string; preview?: string }[]) || [
    { id: 'modern', name: 'Modern Professional' },
    { id: 'classic', name: 'Classic Executive' },
    { id: 'minimal', name: 'Minimal Clean' },
    { id: 'creative', name: 'Creative Designer' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Resume Templates" description="Choose a professional template for your resume" />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((t, i) => (
            <Card key={t.id || i} className="overflow-hidden border-border/40 transition-shadow hover:shadow-md">
              <div className="flex h-40 items-center justify-center bg-muted/30">
                <FileText className="h-16 w-16 text-muted-foreground/40" />
              </div>
              <CardContent className="p-4">
                <p className="font-medium">{t.name || `Template ${i + 1}`}</p>
                <ButtonLink href={`/resume/create?template=${t.id}`} size="sm" className="mt-3 w-full">
                  Use Template
                </ButtonLink>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
