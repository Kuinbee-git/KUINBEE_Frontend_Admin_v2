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
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
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
