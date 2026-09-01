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
  PaginatedResponse,
  ApiSuccessResponse,
  SourceCreatedByType,
} from '@/types';

// ============================================
// Types
// ============================================

export interface SourceListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  isVerified?: boolean;
  createdByType?: SourceCreatedByType | 'ALL';
  sort?:
    | 'createdAt:desc'
    | 'createdAt:asc'
    | 'updatedAt:desc'
    | 'updatedAt:asc'
    | 'name:asc'
    | 'name:desc';
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
  const response = await apiClient.get<
    ApiSuccessResponse<{
      items: Source[];
      page: number;
      pageSize: number;
      total: number;
    }>
  >(`${API_ROUTES.ADMIN.SOURCES.LIST}${query}`);
  const apiData = response.data.data;

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
  const response = await apiClient.post<ApiSuccessResponse<{ source: Source }>>(
    API_ROUTES.ADMIN.SOURCES.CREATE,
    data
  );
  return response.data.data.source;
}

/**
 * Update a source
 */
export async function updateSource(sourceId: string, data: UpdateSourceRequest): Promise<Source> {
  const response = await apiClient.patch<ApiSuccessResponse<{ source: Source }>>(
    API_ROUTES.ADMIN.SOURCES.UPDATE(sourceId),
    data
  );
  return response.data.data.source;
}

/**
 * Delete a source
 */
export async function deleteSource(sourceId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.SOURCES.DELETE(sourceId));
}
