import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';

const getApiProxyTarget = () => {
  const configuredTarget = process.env.ADMIN_API_PROXY_TARGET?.replace(/\/+$/, '');
  if (!configuredTarget) return null;

  const target = new URL(configuredTarget);
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new Error('ADMIN_API_PROXY_TARGET must use HTTP or HTTPS');
  }
  return target.origin;
};

const apiProxyTarget = getApiProxyTarget();

const securityHeaders = [
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'X-Frame-Options', value: 'DENY' },
  ...(isDevelopment
    ? []
    : [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ]),
];

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion', '@tanstack/react-query'],
  },
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
