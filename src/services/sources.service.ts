/**
 * Sources Service
 * API calls for source management (Stage 3)
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  Source,
  CreateSourceRequest,
  UpdateSourceRequest,
  SourceResponse,
  PaginatedResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface SourceListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  isVerified?: boolean;
  sort?: string;
}

// ============================================
// Sources CRUD
// ============================================

/**
 * Get paginated list of sources
 */
export async function getSources(
  params: SourceListParams = {}
): Promise<PaginatedResponse<Source>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<any>(
    `${API_ROUTES.ADMIN.SOURCES.LIST}${query}`
  );
  
  // API returns: { success: true, data: { items, page, pageSize, total } }
  const apiData = response.data?.data || response.data;
  
  return {
    items: apiData.items || [],
    pagination: {
      page: apiData.page || 1,
      pageSize: apiData.pageSize || 50,
      total: apiData.total || 0,
      totalPages: Math.ceil((apiData.total || 0) / (apiData.pageSize || 50)),
    },
  };
}

/**
 * Create a new source
 */
export async function createSource(data: CreateSourceRequest): Promise<Source> {
  const response = await apiClient.post<any>(
    API_ROUTES.ADMIN.SOURCES.CREATE,
    data
  );
  
  // API returns: { success: true, data: { source: {...} } }
  const apiData = response.data?.data || response.data;
  return apiData.source || apiData;
}

/**
 * Update a source
 */
export async function updateSource(
  sourceId: string,
  data: UpdateSourceRequest
): Promise<Source> {
  const response = await apiClient.patch<any>(
    API_ROUTES.ADMIN.SOURCES.UPDATE(sourceId),
    data
  );
  
  // API returns: { success: true, data: { source: {...} } }
  const apiData = response.data?.data || response.data;
  return apiData.source || apiData;
}

/**
 * Delete a source
 */
export async function deleteSource(sourceId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.SOURCES.DELETE(sourceId));
}
