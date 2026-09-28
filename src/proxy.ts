import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const getApiOrigin = (): string | null => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  if (configuredUrl.startsWith('/')) return null;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return null;
  }
};

const getClaruUploadSources = (): string[] => {
  const configured =
    process.env.ADMIN_CLARU_UPLOAD_CONNECT_SRC?.trim() || 'https://*.amazonaws.com';
  const sources = configured.split(/\s+/).filter(Boolean);
  const allowedSource = /^https:\/\/(?:\*\.)?[a-z0-9.-]+(?::\d+)?$/i;
  if (sources.some((source) => !allowedSource.test(source))) {
    throw new Error('ADMIN_CLARU_UPLOAD_CONNECT_SRC contains an invalid CSP source');
  }
  return sources;
};

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const apiOrigin = getApiOrigin();
  const claruUploadSources = getClaruUploadSources();
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''} ${claruUploadSources.join(' ')}${isDevelopment ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
