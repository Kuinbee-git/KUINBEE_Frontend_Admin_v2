import { useQuery } from '@tanstack/react-query';
import { getAddresses } from '@/services/addresses.service';
import type { Address } from '@/types/address.types';

export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
