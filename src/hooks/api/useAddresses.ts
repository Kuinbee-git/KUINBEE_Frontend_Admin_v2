import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from '@/services/addresses.service';
import type { Address } from '@/types/address.types';
import type { CreateAddressRequest, UpdateAddressRequest } from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

const addressKeys = {
  all: ['addresses'] as const,
};

export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: addressKeys.all,
    queryFn: getAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressRequest) => createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
      toast.success('Address added successfully');
    },
    onError: (error: unknown) => toast.error(getFriendlyErrorMessage(error)),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: UpdateAddressRequest }) =>
      updateAddress(addressId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
      toast.success('Address updated successfully');
    },
    onError: (error: unknown) => toast.error(getFriendlyErrorMessage(error)),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
      toast.success('Address deleted successfully');
    },
    onError: (error: unknown) => toast.error(getFriendlyErrorMessage(error)),
  });
}
