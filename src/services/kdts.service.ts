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
} from '@/types';

// ============================================
// Get KDTS Score (Public)
// ============================================

/**
 * Get current KDTS score and history for a dataset
 * Auth: None (Public route)
 */
export async function getDatasetKdts(datasetId: string): Promise<DatasetKdtsGetResponse> {
  const response = await apiClient.get<{ data: DatasetKdtsGetResponse }>(API_ROUTES.ADMIN.DATASETS.KDTS.GET(datasetId));
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
  const response = await apiClient.post<{ data: AdminKdtsUpsertResponse }>(
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
  const response = await apiClient.put<{ data: AdminKdtsUpdateResponse }>(
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
 * Formula: (Q + L + P + U + F) / 5
 */
export function calculateKdtsScore(breakdown: { Q: number; L: number; P: number; U: number; F: number }): number {
  const total = breakdown.Q + breakdown.L + breakdown.P + breakdown.U + breakdown.F;
  return total / 5;
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
    name: 'Completeness & Compliance',
    description: 'How complete and compliant with standards is the dataset?',
    shortName: 'Completeness',
  },
  L: {
    name: 'Legitimacy & Authority',
    description: 'Is the data from a legitimate and authoritative source?',
    shortName: 'Legitimacy',
  },
  P: {
    name: 'Precision & Accuracy',
    description: 'How precise and accurate is the data?',
    shortName: 'Precision',
  },
  U: {
    name: 'Usefulness & Relevance',
    description: 'How useful and relevant is the data for its intended purpose?',
    shortName: 'Usefulness',
  },
  F: {
    name: 'Freshness & Timeliness',
    description: 'How fresh and timely is the data?',
    shortName: 'Freshness',
  },
} as const;
