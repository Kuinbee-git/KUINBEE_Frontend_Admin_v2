'use client';

/**
 * Anti-Flicker Wrapper
 * Prevents flash of wrong content during auth hydration
 * Since middleware handles auth redirects, we can render immediately
 */
export function AntiFlickerWrapper({ children }: { children: React.ReactNode }) {
  // Render immediately - middleware already handled auth checks
  return <>{children}</>;
}
