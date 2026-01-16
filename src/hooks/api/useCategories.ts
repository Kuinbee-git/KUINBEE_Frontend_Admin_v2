/**
 * Categories API Hooks
 * React Query hooks for category management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as categoriesService from '@/services/categories.service';
import type { CategoryListParams } from '@/services/categories.service';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

// ============================================
// Query Keys
// ============================================

export const categoriesKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  list: (params: CategoryListParams) => [...categoriesKeys.lists(), params] as const,
};

// ============================================
// Queries
// ============================================

export function useCategories(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: categoriesKeys.list(params),
    queryFn: () => categoriesService.getCategories(params),
    placeholderData: (previousData) => previousData,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: UpdateCategoryRequest }) =>
      categoriesService.updateCategory(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
    },
  });
}
