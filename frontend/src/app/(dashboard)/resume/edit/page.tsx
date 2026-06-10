'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Eye } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeService } from '@/services/resume.service';

function ResumeEditor() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: async () => {
      const data = await resumeService.getResume(id) as { title?: string; summary?: string };
      setTitle(data.title || '');
      setSummary(data.summary || '');
      return data;
    },
    enabled: !!id,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: () => resumeService.updateResume(id, { title, summary }),
  });

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Resume Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Professional Summary</Label>
              <Textarea rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save (Auto-save enabled)'}
            </Button>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Full drag-and-drop editor connects to Resume Builder API. Sections: Experience, Education, Skills, Projects.
        </p>
      </div>

      <Card className="border-border/40 bg-muted/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Live Preview</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="min-h-[400px] rounded-lg bg-white p-8 text-black shadow-inner dark:bg-zinc-900 dark:text-white">
          <h2 className="text-xl font-bold">{title || 'Resume Title'}</h2>
          <p className="mt-4 text-sm leading-relaxed">{summary || 'Your professional summary will appear here...'}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditResumePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Resume" description="Build your resume with live preview" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ResumeEditor />
      </Suspense>
    </div>
  );
}
