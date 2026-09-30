'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useAdminQueryState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get('q') || '';
  const page = Math.max(1, Number(params.get('page') || '1') || 1);
  const stage = params.get('stage') || '';

  function update(next: { q?: string; page?: number; stage?: string }) {
    const search = new URLSearchParams(params.toString());
    if (next.q !== undefined) {
      if (next.q) search.set('q', next.q);
      else search.delete('q');
    }
    if (next.page !== undefined) {
      if (next.page > 1) search.set('page', String(next.page));
      else search.delete('page');
    }
    if (next.stage !== undefined) {
      if (next.stage) search.set('stage', next.stage);
      else search.delete('stage');
    }
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return { q, page, stage, update };
}
