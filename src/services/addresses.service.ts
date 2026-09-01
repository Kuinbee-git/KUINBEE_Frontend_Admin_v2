/**
 * Addresses Service
 * API calls for address management
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type {
  Address,
  ApiSuccessResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@/types';

// ============================================
// Types
// ============================================

interface AddressResponse {
  address: Address;
}

interface AddressesResponse {
  items: Address[];
}

// ============================================
// Addresses CRUD
// ============================================

/**
 * Get all addresses for the current admin
 */
export async function getAddresses(): Promise<Address[]> {
  const response = await apiClient.get<ApiSuccessResponse<AddressesResponse>>(
    API_ROUTES.ADMIN.ADDRESSES.LIST
  );
  return response.data.data.items;
}

/**
 * Create a new address
 */
export async function createAddress(data: CreateAddressRequest): Promise<Address> {
  const response = await apiClient.post<ApiSuccessResponse<AddressResponse>>(
    API_ROUTES.ADMIN.ADDRESSES.CREATE,
    data
  );
  return response.data.data.address;
}

/**
 * Update an address
 */
export async function updateAddress(
  addressId: string,
  data: UpdateAddressRequest
): Promise<Address> {
  const response = await apiClient.patch<ApiSuccessResponse<AddressResponse>>(
    API_ROUTES.ADMIN.ADDRESSES.UPDATE(addressId),
    data
  );
  return response.data.data.address;
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.ADDRESSES.DELETE(addressId));
}
