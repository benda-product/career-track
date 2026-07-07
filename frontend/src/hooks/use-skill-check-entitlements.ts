import { useQuery } from '@tanstack/react-query';
import { skillCheckService } from '@/services/skillCheck.service';

export function useSkillCheckEntitlements() {
  return useQuery({
    queryKey: ['skill-check-entitlements'],
    queryFn: skillCheckService.getEntitlements,
    staleTime: 60_000,
  });
}
