/**
 * KDTS Scoring Types
 * Type definitions for dataset KDTS quality scoring
 */

// ===== KDTS Breakdown Components =====
export interface KdtsBreakdown {
  Q: number; // Quality
  L: number; // Legal & Compliance
  P: number; // Provenance
  U: number; // Usability
  F: number; // Freshness & Timeliness
}

// ===== KDTS History Entry =====
interface KdtsHistoryEntry {
  id: string;
  datasetId: string;
  finalScore: string; // Decimal string (e.g., "82.50")
  breakdown: KdtsBreakdown;
  adminId: string;
  createdAt: string; // ISO 8601 timestamp
  note: string | null;
  admin?: {
    id: string;
    name: string | null;
  } | null;
}

// ===== GET KDTS Response =====
export interface DatasetKdtsGetResponse {
  currentScore: string | null; // Decimal string (e.g., "82.50")
  breakdown: KdtsBreakdown | null;
  history: KdtsHistoryEntry[];
  updatedAt: string | null; // ISO 8601 timestamp
}

// ===== POST/PUT KDTS Request Body =====
export interface AdminKdtsUpsertBody {
  Q: number;
  L: number;
  P: number;
  U: number;
  F: number;
  note?: string;
}

export interface AdminKdtsUpdateBody {
  Q?: number;
  L?: number;
  P?: number;
  U?: number;
  F?: number;
  note?: string | null;
}

// ===== POST/PUT KDTS Response =====
export interface AdminKdtsUpsertResponse {
  history: KdtsHistoryEntry;
  dataset: {
    id: string;
    kdtsScore: string | null; // Decimal string
    status:
      | 'SUBMITTED'
      | 'UNDER_REVIEW'
      | 'VERIFIED'
      | 'PUBLISHED'
      | 'REJECTED'
      | 'DELISTED'
      | 'ARCHIVED';
    autoDelisted: boolean;
  };
}

export type AdminKdtsUpdateResponse = AdminKdtsUpsertResponse;
