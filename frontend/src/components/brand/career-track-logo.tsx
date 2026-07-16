import { PUBLIC_ASSETS } from '@/constants';
import { cn } from '@/lib/utils';

type CareerTrackLogoProps = {
  className?: string;
  size?: 'md' | 'lg' | 'xl';
  /** Use dark-background logo (career-track_dark.png) on heroes, footers, and dark panels */
  variant?: 'default' | 'dark';
};

const sizeClasses = {
  md: 'h-16 max-w-[240px]',
  lg: 'h-24 max-w-[320px]',
  xl: 'h-32 max-w-[400px]',
} as const;

export function CareerTrackLogo({ className, size = 'lg', variant = 'default' }: CareerTrackLogoProps) {
  const src = variant === 'dark' ? PUBLIC_ASSETS.logoDark : PUBLIC_ASSETS.logo;

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={src}
        alt="CareerTrack"
        className={cn('w-auto object-contain object-left', sizeClasses[size])}
      />
    </div>
  );
}
