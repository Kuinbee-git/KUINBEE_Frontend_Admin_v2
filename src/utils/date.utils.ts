/**
 * Date formatting utilities
 */

/**
 * Format date and time in a readable format
 * @param dateString ISO date string or null
 * @returns Formatted date time or "Never"
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date without time
 * @param dateString ISO date string or null
 * @returns Formatted date or "—"
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '—';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
