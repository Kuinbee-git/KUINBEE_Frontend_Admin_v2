/**
 * Native Fetch API Client
 * Type-safe HTTP client using browser's native fetch
 * Uses HTTP-only cookies for authentication (no Bearer tokens)
 */

import type { ApiError } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const configuredTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
const REQUEST_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 20_000;
const configuredUploadTimeout = Number(process.env.NEXT_PUBLIC_UPLOAD_TIMEOUT_MS);
const UPLOAD_TIMEOUT_MS =
  Number.isFinite(configuredUploadTimeout) && configuredUploadTimeout > 0
    ? configuredUploadTimeout
    : 10 * 60 * 1000;

/**
 * Fired when an authenticated request proves that the browser session is no
 * longer valid. The dashboard guard owns the redirect and cache cleanup so
 * public authentication screens can still render ordinary 401 errors.
 */
export const SESSION_EXPIRED_EVENT = 'kuinbee:session-expired';

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
    const runtimeOrigin =
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const url = new URL(`${this.baseURL.replace(/\/+$/, '')}${endpoint}`, runtimeOrigin);

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

      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }

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
    if (body !== undefined && !skipContentType) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    let didTimeout = false;
    const forwardAbort = () => controller.abort(rest.signal?.reason);
    if (rest.signal?.aborted) forwardAbort();
    else rest.signal?.addEventListener('abort', forwardAbort, { once: true });
    const timeoutId = globalThis.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...rest,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
        // IMPORTANT: Include credentials for cookie-based auth
        credentials: 'include',
        signal: controller.signal,
        // Raw bodies are supported when callers intentionally omit JSON content type.
        body:
          body === undefined
            ? undefined
            : skipContentType
              ? (body as BodyInit)
              : JSON.stringify(body),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        const apiError: ApiError = {
          code: didTimeout ? 'REQUEST_TIMEOUT' : 'REQUEST_ABORTED',
          message: didTimeout
            ? 'The server took too long to respond. Please try again.'
            : 'The request was cancelled.',
          statusCode: 0,
        };
        throw apiError;
      }

      // Handle network errors (CORS, connection refused, timeout, etc.)
      if (error instanceof TypeError) {
        const apiError: ApiError = {
          code: 'NETWORK_ERROR',
          message:
            'Unable to connect to the server. Please check your internet connection or try again later.',
          statusCode: 0,
        };
        throw apiError;
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timeoutId);
      rest.signal?.removeEventListener('abort', forwardAbort);
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
    requiredHeaders: Record<string, string> = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const headers = new Headers(requiredHeaders);
      if (!headers.has('Content-Type') && file.type) headers.set('Content-Type', file.type);

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error: ApiError = {
          code: 'UPLOAD_FAILED',
          message: `Storage rejected the upload (${response.status}). Please try again.`,
          statusCode: response.status,
        };
        throw error;
      }

      return response;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) throw error;
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        const apiError: ApiError = {
          code: 'UPLOAD_TIMEOUT',
          message: 'The file upload took too long. Check your connection and try again.',
          statusCode: 0,
        };
        throw apiError;
      }
      if (error instanceof TypeError) {
        const apiError: ApiError = {
          code: 'NETWORK_ERROR',
          message: 'The storage service could not be reached. Check your connection and try again.',
          statusCode: 0,
        };
        throw apiError;
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }
}

// ============================================
// Export singleton instance
// ============================================

export const apiClient = new ApiClient(BASE_URL);

// Re-export types for convenience
export type { QueryParams };
