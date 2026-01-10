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
  const response = await apiClient.get<PaginatedResponse<Category>>(
    `${API_ROUTES.ADMIN.CATEGORIES.LIST}${query}`
  );
  return response.data;
}

/**
 * Create a new category
 */
export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await apiClient.post<CategoryResponse>(
    API_ROUTES.ADMIN.CATEGORIES.CREATE,
    data
  );
  return response.data.category;
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryRequest
): Promise<Category> {
  const response = await apiClient.patch<CategoryResponse>(
    API_ROUTES.ADMIN.CATEGORIES.UPDATE(categoryId),
    data
  );
  return response.data.category;
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.CATEGORIES.DELETE(categoryId));
}
