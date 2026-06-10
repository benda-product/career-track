'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resumeService } from '@/services/resume.service';

export default function CreateResumePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const resume = await resumeService.createResume({ title, templateId: 'default' }) as { id?: string };
      router.push(`/resume/edit?id=${resume.id || ''}`);
    } catch {
      router.push('/resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Create Resume" description="Start building your ATS-optimized resume" />
      <Card>
        <CardHeader><CardTitle className="text-base">Resume Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resume Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Engineer Resume" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title || loading}>Create & Edit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
