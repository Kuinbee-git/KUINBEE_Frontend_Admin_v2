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
  const response = await apiClient.get<PaginatedResponse<Source>>(
    `${API_ROUTES.ADMIN.SOURCES.LIST}${query}`
  );
  return response.data;
}

/**
 * Create a new source
 */
export async function createSource(data: CreateSourceRequest): Promise<Source> {
  const response = await apiClient.post<SourceResponse>(
    API_ROUTES.ADMIN.SOURCES.CREATE,
    data
  );
  return response.data.source;
}

/**
 * Update a source
 */
export async function updateSource(
  sourceId: string,
  data: UpdateSourceRequest
): Promise<Source> {
  const response = await apiClient.patch<SourceResponse>(
    API_ROUTES.ADMIN.SOURCES.UPDATE(sourceId),
    data
  );
  return response.data.source;
}

/**
 * Delete a source
 */
export async function deleteSource(sourceId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.SOURCES.DELETE(sourceId));
}
