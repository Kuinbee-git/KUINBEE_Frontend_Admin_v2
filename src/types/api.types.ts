/**
 * API Response Types
 * Common types for API interactions
 */

// ============================================
// Error Types
// ============================================

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// ============================================
// Paginated Response (standard backend format)
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
}

// ============================================
// API Wrapper Response (for endpoints that wrap data)
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
