/**
 * Addresses Service
 * API calls for address management
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '@/types';

// ============================================
// Types
// ============================================

export interface AddressResponse {
  address: Address;
}

export interface AddressesResponse {
  items: Address[];
}

// ============================================
// Addresses CRUD
// ============================================

/**
 * Get all addresses for the current admin
 */
export async function getAddresses(): Promise<Address[]> {
  const response = await apiClient.get<{ success: boolean; data: AddressesResponse }>(
    API_ROUTES.ADMIN.ADDRESSES.LIST
  );
  return response.data.data.items;
}

/**
 * Create a new address
 */
export async function createAddress(data: CreateAddressRequest): Promise<Address> {
  const response = await apiClient.post<AddressResponse>(
    API_ROUTES.ADMIN.ADDRESSES.CREATE,
    data
  );
  return response.data.address;
}

/**
 * Update an address
 */
export async function updateAddress(
  addressId: string,
  data: UpdateAddressRequest
): Promise<Address> {
  const response = await apiClient.patch<AddressResponse>(
    API_ROUTES.ADMIN.ADDRESSES.UPDATE(addressId),
    data
  );
  return response.data.address;
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.ADDRESSES.DELETE(addressId));
}