'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getBendaSignInUrl, getBendaSignUpUrl } from '@/lib/benda-auth';

type BendaAuthPanelProps = {
  product?: 'career_track' | 'talent_desk';
};

export function BendaAuthPanel({ product = 'career_track' }: BendaAuthPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-medium text-foreground">
        Registered on Benda Infotech?
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Use your Benda Infotech email and password, or Google / Apple sign-in. Direct Career Track
        login only works for accounts created here.
      </p>
      <a
        href={getBendaSignInUrl(product)}
        className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'w-full')}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Sign in with Benda Infotech
      </a>
      <p className="text-center text-xs text-muted-foreground">
        New here?{' '}
        <Link href={getBendaSignUpUrl(product)} className="font-medium text-primary hover:underline">
          Create a Benda account
        </Link>
      </p>
    </div>
  );
}
