/**
 * Source Types
 * Matches backend /api/v1/admin/sources/* responses
 */

// ============================================
// Enums
// ============================================

export type SourceCreatedByType = 'PLATFORM' | 'SUPPLIER';

// ============================================
// Source Entity
// ============================================

export interface Source {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  createdBy: string;
  createdByType: SourceCreatedByType;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  /** Optional: computed field for dataset count */
  datasetCount?: number;
}

// ============================================
// Request Types
// ============================================

export interface CreateSourceRequest {
  name: string;
  description?: string;
  websiteUrl?: string;
  isVerified?: boolean;
}

export interface UpdateSourceRequest {
  name?: string;
  description?: string | null;
  websiteUrl?: string | null;
  isVerified?: boolean;
}

// ============================================
// Response Types
// ============================================

export interface SourceResponse {
  source: Source;
}

// ============================================
// Legacy Types (for UI compatibility)
// ============================================

/** @deprecated */
export type SourceStatus = 'active' | 'archived';

/** @deprecated */
export type SourceType = 'api' | 'database' | 'file' | 'stream' | 'manual';

/** @deprecated Use Source instead */
export interface LegacySource {
  id: string;
  name: string;
  description?: string;
  type: SourceType;
  status: SourceStatus;
  datasetsCount: number;
  createdAt: string;
  updatedAt?: string;
  url?: string;
  credentialRequired?: boolean;
}
