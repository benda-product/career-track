import { PUBLIC_ASSETS } from '@/constants';
import { cn } from '@/lib/utils';

type CareerTrackLogoProps = {
  className?: string;
  size?: 'md' | 'lg' | 'xl';
};

const sizeClasses = {
  md: 'h-16 max-w-[240px]',
  lg: 'h-24 max-w-[320px]',
  xl: 'h-32 max-w-[400px]',
} as const;

export function CareerTrackLogo({ className, size = 'lg' }: CareerTrackLogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={PUBLIC_ASSETS.logo}
        alt="CareerTrack"
        className={cn('w-auto object-contain object-left', sizeClasses[size])}
      />
    </div>
  );
}
