/**
 * Error Utils
 * Helper functions for error handling
 */

import type { ApiError } from '@/types';

/**
 * Extract error message from different error types
 */
function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  // ApiError from our client
  if (typeof error === 'object' && 'message' in error && 'code' in error) {
    const apiError = error as ApiError;
    return apiError.message || 'An error occurred';
  }

  // Standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is an ApiError
 */
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'statusCode' in error
  );
}

/** A 401 is handled globally by clearing the session and redirecting to sign-in. */
export function isSessionExpiredError(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 401;
}

/**
 * Get user-friendly error message
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return getErrorMessage(error);
  }

  // Map common status codes to friendly messages
  switch (error.statusCode) {
    case 400:
      return error.message || 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please login again.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return error.message || 'This action conflicts with existing data.';
    case 422:
      return error.message || 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}
