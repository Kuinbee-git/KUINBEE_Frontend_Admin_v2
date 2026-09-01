/**
 * KDTS Scoring Service
 * API calls for KDTS dataset quality scoring
 */

import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type {
  DatasetKdtsGetResponse,
  AdminKdtsUpsertBody,
  AdminKdtsUpsertResponse,
  AdminKdtsUpdateBody,
  AdminKdtsUpdateResponse,
  ApiSuccessResponse,
} from '@/types';

// ============================================
// Get KDTS Score (Admin)
// ============================================

/**
 * Get current KDTS score and internal scoring history for a dataset.
 * Auth: Admin/Superadmin with dataset detail access.
 */
export async function getDatasetKdts(datasetId: string): Promise<DatasetKdtsGetResponse> {
  const response = await apiClient.get<ApiSuccessResponse<DatasetKdtsGetResponse>>(
    API_ROUTES.ADMIN.DATASETS.KDTS.GET(datasetId)
  );
  return response.data.data;
}

// ============================================
// Create/Update KDTS Score (Admin)
// ============================================

/**
 * Create or update KDTS score for a dataset
 * Auth: Admin/Superadmin with EDIT_DATASET_METADATA permission
 */
export async function createOrUpdateKdts(
  datasetId: string,
  body: AdminKdtsUpsertBody
): Promise<AdminKdtsUpsertResponse> {
  const response = await apiClient.post<ApiSuccessResponse<AdminKdtsUpsertResponse>>(
    API_ROUTES.ADMIN.DATASETS.KDTS.CREATE_UPDATE(datasetId),
    body
  );
  return response.data.data;
}

// ============================================
// Update KDTS History Entry (Admin)
// ============================================

/**
 * Update a specific KDTS history entry
 * Auth: Admin/Superadmin with EDIT_DATASET_METADATA permission
 * Note: At least one field (Q, L, P, U, F, or note) is required
 */
export async function updateKdtsHistory(
  historyId: string,
  body: AdminKdtsUpdateBody
): Promise<AdminKdtsUpdateResponse> {
  const response = await apiClient.put<ApiSuccessResponse<AdminKdtsUpdateResponse>>(
    API_ROUTES.ADMIN.DATASETS.KDTS.UPDATE_HISTORY(historyId),
    body
  );
  return response.data.data;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate final KDTS score from breakdown
 * Formula: 30% Q + 25% L + 20% P + 15% U + 10% F.
 */
export function calculateKdtsScore(breakdown: {
  Q: number;
  L: number;
  P: number;
  U: number;
  F: number;
}): number {
  const score =
    0.3 * breakdown.Q +
    0.25 * breakdown.L +
    0.2 * breakdown.P +
    0.15 * breakdown.U +
    0.1 * breakdown.F;
  return Math.round(score * 100) / 100;
}

/**
 * Format KDTS score to 2 decimal places
 */
export function formatKdtsScore(score: number | string): string {
  const num = typeof score === 'string' ? parseFloat(score) : score;
  return isNaN(num) ? 'N/A' : num.toFixed(2);
}

/**
 * Get KDTS breakdown labels
 */
export const KDTS_LABELS = {
  Q: {
    name: 'Quality',
    description: 'Schema integrity, completeness, accuracy, uniqueness, and distribution health.',
    shortName: 'Quality',
  },
  L: {
    name: 'Legal & Compliance',
    description: 'Ownership, resale permission, privacy risk, and jurisdiction fit.',
    shortName: 'Legal',
  },
  P: {
    name: 'Provenance',
    description: 'Methodology, source type, transformation lineage, and bias disclosure.',
    shortName: 'Provenance',
  },
  U: {
    name: 'Usability',
    description: 'Joinability, documentation, delivery readiness, and integration ease.',
    shortName: 'Usability',
  },
  F: {
    name: 'Freshness & Timeliness',
    description: 'How fresh and timely is the data?',
    shortName: 'Freshness',
  },
} as const;
