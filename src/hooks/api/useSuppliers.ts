/**
 * Suppliers API Hooks
 * React Query hooks for supplier management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as suppliersService from '@/services/suppliers.service';
import type { 
  SupplierListParams, 
  SupplierAnalyticsParams
} from '@/services/suppliers.service';

// ============================================
// Query Keys
// ============================================

export const suppliersKeys = {
  all: ['suppliers'] as const,
  lists: () => [...suppliersKeys.all, 'list'] as const,
  list: (params: SupplierListParams) => [...suppliersKeys.lists(), params] as const,
  details: () => [...suppliersKeys.all, 'detail'] as const,
  detail: (id: string) => [...suppliersKeys.details(), id] as const,
  analytics: (id: string, params: SupplierAnalyticsParams) => [...suppliersKeys.all, 'analytics', id, params] as const,
  kyc: (id: string) => [...suppliersKeys.all, 'kyc', id] as const,
};

// ============================================
// Query Hooks
// ============================================

/**
 * Get paginated list of suppliers
 */
export function useSuppliers(params: SupplierListParams = {}) {
  return useQuery({
    queryKey: suppliersKeys.list(params),
    queryFn: () => suppliersService.getSuppliers(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Get supplier detail by ID
 */
export function useSupplier(supplierId: string) {
  return useQuery({
    queryKey: suppliersKeys.detail(supplierId),
    queryFn: () => suppliersService.getSupplierById(supplierId),
    enabled: !!supplierId,
  });
}

/**
 * Get supplier analytics
 */
export function useSupplierAnalytics(
  supplierId: string, 
  params: SupplierAnalyticsParams = {}
) {
  return useQuery({
    queryKey: suppliersKeys.analytics(supplierId, params),
    queryFn: () => suppliersService.getSupplierAnalytics(supplierId, params),
    enabled: !!supplierId,
  });
}

/**
 * Get supplier KYC details
 */
export function useSupplierKyc(supplierId: string) {
  return useQuery({
    queryKey: suppliersKeys.kyc(supplierId),
    queryFn: () => suppliersService.getSupplierKyc(supplierId),
    enabled: !!supplierId,
  });
}