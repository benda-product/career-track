'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Star, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { resumeService } from '@/services/resume.service';

export default function ResumePage() {
  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume"
        description="Manage your resumes via Resume Builder integration"
        action={
          <div className="flex gap-2">
            <ButtonLink href="/resume/templates" variant="outline">Templates</ButtonLink>
            <ButtonLink href="/resume/create"><Plus className="mr-2 h-4 w-4" />Create Resume</ButtonLink>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : !resumes?.length ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Create your first ATS-optimized resume to start applying for jobs."
          action={{ label: 'Create Resume', onClick: () => window.location.href = '/resume/create' }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(resumes as { id?: string; title?: string; score?: number }[]).map((resume, i) => (
            <Card key={resume.id || i} className="border-border/40 bg-card/50 transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{resume.title || `Resume ${i + 1}`}</CardTitle>
                  {resume.score && (
                    <Badge variant="secondary"><Star className="mr-1 h-3 w-3" />{resume.score}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <ButtonLink href={`/resume/edit?id=${resume.id}`} size="sm" variant="outline">Edit</ButtonLink>
                <ButtonLink href={`/resume/score?id=${resume.id}`} size="sm" variant="outline">Score</ButtonLink>
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
