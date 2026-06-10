'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Edit, MapPin, Phone, Link as LinkIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/link-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });
  const { data: completion } = useQuery({
    queryKey: ['profile-completion'],
    queryFn: profileService.getCompletion,
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your master candidate profile"
        action={
          <ButtonLink href="/profile/edit">
            <Edit className="mr-2 h-4 w-4" />Edit Profile
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/40 bg-card/50 lg:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-muted-foreground">{profile?.headline || 'Add a headline'}</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {profile?.location && (
                <p className="flex items-center justify-center gap-2"><MapPin className="h-4 w-4" />{profile.location}</p>
              )}
              {profile?.phone && (
                <p className="flex items-center justify-center gap-2"><Phone className="h-4 w-4" />{profile.phone}</p>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span>Profile Strength</span>
                <span className="font-medium">{completion?.score ?? 0}%</span>
              </div>
              <Progress value={completion?.score ?? 0} />
              <Badge className="mt-2" variant="secondary">{completion?.strength}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {profile?.summary && (
            <Card className="border-border/40 bg-card/50">
              <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{profile.summary}</p></CardContent>
            </Card>
          )}

          <Card className="border-border/40 bg-card/50">
            <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.length ? profile.skills.map((s) => (
                  <Badge key={s.name} variant="outline">{s.name} · {s.level}</Badge>
                )) : <p className="text-sm text-muted-foreground">No skills added yet</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader><CardTitle className="text-base">Experience</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {profile?.experience?.length ? profile.experience.map((exp, i) => (
                <div key={i} className="border-l-2 border-primary/30 pl-4">
                  <p className="font-medium">{exp.title}</p>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  {exp.description && <p className="mt-1 text-sm">{exp.description}</p>}
                </div>
              )) : <p className="text-sm text-muted-foreground">No experience added</p>}
            </CardContent>
          </Card>

          {profile?.socialLinks?.length ? (
            <Card className="border-border/40 bg-card/50">
              <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {profile.socialLinks.map((link) => (
                  <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <LinkIcon className="h-4 w-4" />{link.platform}
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
