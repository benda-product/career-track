import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';

export function usePlanEntitlements() {
  return useQuery({
    queryKey: ['plan-entitlements'],
    queryFn: billingService.getEntitlements,
    staleTime: 60_000,
  });
}
