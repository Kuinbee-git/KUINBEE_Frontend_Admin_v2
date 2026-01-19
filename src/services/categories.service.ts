/**
 * Categories Service
 * API calls for category management (Stage 3)
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import { buildQueryString } from '@/lib/utils/service.utils';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryResponse,
  PaginatedResponse,
} from '@/types';

// ============================================
// Types
// ============================================

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
}

// ============================================
// Categories CRUD
// ============================================

/**
 * Get paginated list of categories
 */
export async function getCategories(
  params: CategoryListParams = {}
): Promise<PaginatedResponse<Category>> {
  const query = buildQueryString(params);
  const response = await apiClient.get<any>(
    `${API_ROUTES.ADMIN.CATEGORIES.LIST}${query}`
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
 * Create a new category
 */
export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await apiClient.post<any>(
    API_ROUTES.ADMIN.CATEGORIES.CREATE,
    data
  );
  
  // API returns: { success: true, data: { category: {...} } }
  const apiData = response.data?.data || response.data;
  return apiData.category || apiData;
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryRequest
): Promise<Category> {
  const response = await apiClient.patch<any>(
    API_ROUTES.ADMIN.CATEGORIES.UPDATE(categoryId),
    data
  );
  
  // API returns: { success: true, data: { category: {...} } }
  const apiData = response.data?.data || response.data;
  return apiData.category || apiData;
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.CATEGORIES.DELETE(categoryId));
}
