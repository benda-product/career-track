'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, LayoutGrid, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resumeService } from '@/services/resume.service';
import { skillCheckService } from '@/services/skillCheck.service';

export type CandidateProductId = 'career-track' | 'resume-ai' | 'skillcheck';

type ProductOption = {
  id: CandidateProductId;
  name: string;
  description: string;
  logo: string;
};

const PRODUCTS: ProductOption[] = [
  {
    id: 'career-track',
    name: 'Career Track',
    description: 'Jobs, profile & learning',
    logo: '/images/logos/career-track.png',
  },
  {
    id: 'resume-ai',
    name: 'Resume AI',
    description: 'Build & score resumes',
    logo: '/images/logos/resume-ai.png',
  },
  {
    id: 'skillcheck',
    name: 'SkillCheck',
    description: 'Skill tests & certificates',
    logo: '/images/logos/skillcheck.png',
  },
];

type ProductAppSwitcherProps = {
  current: CandidateProductId;
  className?: string;
  /** Compact trigger for tight sidebars */
  compact?: boolean;
  onNavigate?: (id: CandidateProductId) => void | Promise<void>;
};

type MenuCoords = {
  top: number;
  left: number;
  width: number;
};

export function ProductAppSwitcher({
  current,
  className,
  compact = false,
  onNavigate,
}: ProductAppSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<CandidateProductId | null>(null);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentProduct = PRODUCTS.find((p) => p.id === current) || PRODUCTS[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    const trigger = rootRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 288;
    const gap = 6;
    const padding = 8;
    // Prefer aligning to the right edge of the trigger so the menu stays over the sidebar
    let left = rect.right - menuWidth;
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
    const top = Math.min(rect.bottom + gap, window.innerHeight - padding);
    setCoords({ top, left, width: menuWidth });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = async (id: CandidateProductId) => {
    if (id === current || loadingId) return;
    setLoadingId(id);
    try {
      if (onNavigate) {
        await onNavigate(id);
      }
      setOpen(false);
    } catch (err) {
      console.error('App switch failed', err);
      setLoadingId(null);
    }
  };

  const menu =
    open && mounted && coords ? (
      <div
        ref={menuRef}
        role="listbox"
        style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          width: coords.width,
          zIndex: 80,
        }}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
      >
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Switch app
        </p>
        {PRODUCTS.map((product) => {
          const isCurrent = product.id === current;
          const isLoading = loadingId === product.id;
          return (
            <button
              key={product.id}
              type="button"
              role="option"
              aria-selected={isCurrent}
              disabled={isCurrent || Boolean(loadingId)}
              onClick={() => void handleSelect(product.id)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                isCurrent ? 'bg-slate-50' : 'hover:bg-slate-50',
                (isCurrent || loadingId) && 'cursor-default',
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200/80">
                <img
                  src={product.logo}
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-900">{product.name}</span>
                  {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                </div>
                <p className="text-[11px] text-slate-500">{product.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={cn('relative z-50', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch app"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-800',
          compact ? 'h-8 px-1.5' : 'h-9 px-2',
        )}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        {!compact && (
          <span className="max-w-[7.5rem] truncate text-[11px] font-semibold">
            {currentProduct.name}
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {mounted ? createPortal(menu, document.body) : null}
    </div>
  );
}

/** Career Track: SSO into sibling dashboards, stay on CT for self. */
export async function switchFromCareerTrack(id: CandidateProductId) {
  if (id === 'career-track') return;

  const returnUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;

  if (id === 'resume-ai') {
    const session = await resumeService.getSsoRedirect({
      targetPath: '/dashboard',
      returnUrl,
    });
    window.location.href = session.url;
    return;
  }

  if (id === 'skillcheck') {
    const session = await skillCheckService.getSsoRedirect({
      targetPath: '/dashboard?tab=profile',
      returnUrl,
    });
    window.location.href = session.url;
  }
}
