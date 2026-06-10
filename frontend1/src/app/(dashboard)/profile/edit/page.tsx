'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { profileService } from '@/services/profile.service';
import { Profile } from '@/types';

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });

  const { register, handleSubmit, reset } = useForm<Partial<Profile>>();

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.push('/profile');
    },
  });

  if (isLoading) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit Profile" description="Update your candidate profile" />
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input {...register('headline')} placeholder="Senior Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea {...register('summary')} rows={4} placeholder="Tell employers about yourself..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...register('location')} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
