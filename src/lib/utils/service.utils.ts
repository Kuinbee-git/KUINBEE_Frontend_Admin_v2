/**
 * Service Utilities
 * Helper functions used across multiple services
 */

/**
 * Build URL query string from params object
 * Filters out undefined, null, and 'ALL' values
 */
export function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== 'ALL') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
