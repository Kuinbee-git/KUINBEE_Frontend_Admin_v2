/**
 * Native Fetch API Client
 * Type-safe HTTP client using browser's native fetch
 * Uses HTTP-only cookies for authentication (no Bearer tokens)
 */

import type { ApiError } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ============================================
// Types
// ============================================

type QueryParamValue = string | number | boolean | undefined | null;
type QueryParams = Record<string, QueryParamValue>;

interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: QueryParams;
  body?: unknown;
  /** Skip JSON content-type header (for file uploads) */
  skipContentType?: boolean;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

// ============================================
// API Client Class
// ============================================

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Build URL with query parameters
   * Filters out undefined/null values
   */
  private buildUrl(endpoint: string, params?: QueryParams): string {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Handle API response
   * Throws ApiError for non-ok responses
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // Log response for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[API] ${response.status} ${response.url}`);
    }

    // Handle error responses
    if (!response.ok) {
      let errorMessage = response.statusText || 'Request failed';
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetails: Record<string, unknown> | undefined;

      // Add default messages for common status codes
      if (response.status === 401) {
        errorMessage = 'Unauthorized - Authentication required';
        errorCode = 'UNAUTHORIZED';
      } else if (response.status === 403) {
        errorMessage = 'Forbidden - Access denied';
        errorCode = 'FORBIDDEN';
      } else if (response.status === 404) {
        errorMessage = 'Not found';
        errorCode = 'NOT_FOUND';
      } else if (response.status === 500) {
        errorMessage = 'Internal server error';
        errorCode = 'SERVER_ERROR';
      }

      if (isJson) {
        try {
          const errorData = await response.json();
          // Override with backend message if available
          errorMessage = errorData.message || errorData.error?.message || errorMessage;
          errorCode = errorData.code || errorData.error?.code || errorCode;
          errorDetails = errorData.details || errorData.error;
        } catch {
          // JSON parse failed, use default message
        }
      }

      const error: ApiError = {
        code: errorCode,
        message: errorMessage,
        statusCode: response.status,
        details: errorDetails,
      };

      // Log error for debugging
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error('[API Error]', {
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }

      // Don't auto-redirect on 401 - let the app handle it
      // The dashboard/components will handle auth failures appropriately

      throw error;
    }

    // Parse successful response
    let data: T;
    if (isJson) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = (await response.text()) as unknown as T;
    } else {
      data = null as unknown as T;
    }

    return {
      data,
      status: response.status,
      ok: true,
    };
  }

  /**
   * Make HTTP request
   * Automatically includes credentials (cookies) for auth
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const { params, body, headers, skipContentType, ...rest } = config;
    const url = this.buildUrl(endpoint, params);

    // Default headers
    const defaultHeaders: HeadersInit = {};
    
    // Add JSON content-type for requests with body (unless skipped)
    if (body && !skipContentType) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...rest,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
        // IMPORTANT: Include credentials for cookie-based auth
        credentials: 'include',
        // Serialize body as JSON if it's an object
        body: body ? JSON.stringify(body) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      // Handle network errors (CORS, connection refused, timeout, etc.)
      if (error instanceof TypeError) {
        const apiError: ApiError = {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection or try again later.',
          statusCode: 0,
        };
        throw apiError;
      }
      throw error;
    }
  }

  // ============================================
  // HTTP Method Shortcuts
  // ============================================

  async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body?: unknown, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, params });
  }

  async put<T>(endpoint: string, body?: unknown, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, params });
  }

  async patch<T>(endpoint: string, body?: unknown, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, params });
  }

  async delete<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }

  // ============================================
  // File Upload (for presigned URLs)
  // ============================================

  /**
   * Upload file directly to presigned S3 URL
   */
  async uploadToPresignedUrl(
    presignedUrl: string,
    file: File | Blob,
    contentType?: string
  ): Promise<Response> {
    return fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: contentType ? { 'Content-Type': contentType } : undefined,
    });
  }
}

// ============================================
// Export singleton instance
// ============================================

export const apiClient = new ApiClient(BASE_URL);

// Re-export types for convenience
export type { ApiResponse, RequestConfig, QueryParams };
