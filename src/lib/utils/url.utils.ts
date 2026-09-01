export const getSafeHttpUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};

const getUserAppBaseUrl = (): string | null => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_USER_APP_URL || process.env.NEXT_PUBLIC_MARKETPLACE_URL;
  const developmentFallback =
    process.env.NODE_ENV === 'development' ? 'http://localhost:5175' : null;

  return getSafeHttpUrl(configuredUrl ?? developmentFallback);
};

export const buildUserAppUrl = (path: string): string | null => {
  const baseUrl = getUserAppBaseUrl();
  if (!baseUrl) return null;

  try {
    return new URL(path.replace(/^\/+/, ''), baseUrl).toString();
  } catch {
    return null;
  }
};

export const openExternalUrl = (value: string): boolean => {
  const safeUrl = getSafeHttpUrl(value);
  if (!safeUrl || typeof window === 'undefined') return false;

  const opened = window.open(safeUrl, '_blank', 'noopener,noreferrer');
  if (opened) opened.opener = null;
  return Boolean(opened);
};
