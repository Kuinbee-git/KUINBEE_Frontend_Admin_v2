/**
 * KDTS Scoring Types
 * Type definitions for dataset KDTS quality scoring
 */

// ===== KDTS Breakdown Components =====
export interface KdtsBreakdown {
  Q: number; // Completeness & Compliance
  L: number; // Legitimacy & Authority
  P: number; // Precision & Accuracy
  U: number; // Usefulness & Relevance
  F: number; // Freshness & Timeliness
}

// ===== KDTS History Entry =====
export interface KdtsHistoryEntry {
  id: string;
  datasetId: string;
  finalScore: string; // Decimal string (e.g., "82.50")
  breakdown: KdtsBreakdown;
  adminId: string;
  createdAt: string; // ISO 8601 timestamp
  note: string;
  admin?: {
    id: string;
    name: string;
  };
}

// ===== GET KDTS Response =====
export interface DatasetKdtsGetResponse {
  currentScore: string; // Decimal string (e.g., "82.50")
  breakdown: KdtsBreakdown;
  history: KdtsHistoryEntry[];
  updatedAt: string; // ISO 8601 timestamp
}

// ===== POST/PUT KDTS Request Body =====
export interface AdminKdtsUpsertBody {
  Q?: number;
  L?: number;
  P?: number;
  U?: number;
  F?: number;
  note: string;
}

export interface AdminKdtsUpdateBody {
  Q?: number;
  L?: number;
  P?: number;
  U?: number;
  F?: number;
  note?: string;
}

// ===== POST/PUT KDTS Response =====
export interface AdminKdtsUpsertResponse {
  history: KdtsHistoryEntry;
  dataset: {
    id: string;
    kdtsScore: string; // Decimal string
  };
}

export interface AdminKdtsUpdateResponse extends AdminKdtsUpsertResponse {}

// ===== Combined types =====
export interface KdtsHistory {
  id: string;
  datasetId: string;
  finalScore: string;
  breakdown: KdtsBreakdown;
  adminId: string;
  createdAt: string;
  note: string;
  admin: {
    id: string;
    name: string;
  };
}
