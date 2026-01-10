/**
 * Category Types
 * Matches backend /api/v1/admin/categories/* responses
 */

// ============================================
// Category Entity
// ============================================

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  /** Optional: computed field for dataset count */
  datasetCount?: number;
}

// ============================================
// Request Types
// ============================================

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name?: string;
}

// ============================================
// Response Types
// ============================================

export interface CategoryResponse {
  category: Category;
}

// ============================================
// Legacy Types (for UI compatibility)
// ============================================

/** @deprecated */
export type CategoryStatus = 'active' | 'archived';

/** @deprecated Use Category instead */
export interface LegacyCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  status: CategoryStatus;
  datasetsCount: number;
  createdAt: string;
  updatedAt?: string;
  icon?: string;
}
