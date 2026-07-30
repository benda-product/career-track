'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, LayoutGrid, Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { resumeService } from '@/services/resume.service';
import { skillCheckService } from '@/services/skillCheck.service';
import { usePlanEntitlements } from '@/hooks/use-plan-entitlements';
import {
  careerProBillingHref,
  isPlanGateError,
  startCareerProPurchase,
  storePurchaseIntent,
} from '@/utils/purchase-intent';
import { isAxiosError } from 'axios';

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
  compact?: boolean;
  onNavigate?: (id: CandidateProductId) => void | Promise<void>;
};

type MenuCoords = {
  top: number;
  left: number;
  width: number;
};

function errorMessage(err: unknown) {
  if (isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message || err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Unable to switch app.';
}

function errorStatus(err: unknown) {
  if (isAxiosError(err)) return err.response?.status;
  return undefined;
}

export function ProductAppSwitcher({
  current,
  className,
  compact = false,
  onNavigate,
}: ProductAppSwitcherProps) {
  const router = useRouter();
  const { data: entitlements } = usePlanEntitlements();
  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<CandidateProductId | null>(null);
  const [error, setError] = useState('');
  const [lockedProduct, setLockedProduct] = useState<ProductOption | null>(null);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentProduct = PRODUCTS.find((p) => p.id === current) || PRODUCTS[0];
  const onPro = entitlements?.plan === 'pro';

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

  const goPurchase = () => {
    storePurchaseIntent({ product: lockedProduct?.id || 'career-pro' });
    setOpen(false);
    router.push(careerProBillingHref('monthly'));
  };

  const handleSelect = async (id: CandidateProductId) => {
    if (id === current || loadingId) return;
    setLoadingId(id);
    setError('');
    setLockedProduct(null);

    try {
      if (onNavigate) {
        await onNavigate(id);
      }
      setOpen(false);
    } catch (err) {
      setLoadingId(null);
      const message = errorMessage(err);
      const status = errorStatus(err);
      if (isPlanGateError(message, status)) {
        const product = PRODUCTS.find((p) => p.id === id) || null;
        setLockedProduct(product);
        setError('');
        return;
      }
      setError(message);
      console.error('App switch failed', err);
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
                (isCurrent || loadingId) && 'cursor-default'
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200/80">
                <img src={product.logo} alt="" className="h-7 w-7 object-contain" />
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

        {!onPro ? (
          <div className="mx-2 mb-2 mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold leading-snug text-emerald-900">
              Career Pro unlocks Resume AI Pro + SkillCheck Pro in one plan.
            </p>
            <button
              type="button"
              className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary text-[12px] font-bold text-white hover:opacity-95"
              onClick={() => {
                setOpen(false);
                startCareerProPurchase('monthly');
              }}
            >
              Upgrade &amp; purchase
            </button>
          </div>
        ) : null}

        {lockedProduct ? (
          <div className="mx-2 mb-2 mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <p className="flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-red-800">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              A paid plan is required to open {lockedProduct.name}.
            </p>
            <button
              type="button"
              className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary text-[12px] font-bold text-white"
              onClick={goPurchase}
            >
              Upgrade &amp; purchase
            </button>
          </div>
        ) : null}

        {error ? <p className="px-3 pb-2 text-[10px] text-red-600">{error}</p> : null}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={cn('relative z-50', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch app"
        onClick={() => {
          setError('');
          setLockedProduct(null);
          setOpen((v) => !v);
        }}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-800',
          compact ? 'h-8 px-1.5' : 'h-9 px-2'
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
