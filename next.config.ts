import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize development experience
  reactStrictMode: false, // Disable double-rendering in dev
  
  // Disable Turbopack - use Webpack for more stable dev experience
  // turbopack: false,
  
  // Transpile packages that might cause issues
  transpilePackages: ['lucide-react'],
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports - reduces bundle parsing time
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'motion',
      '@tanstack/react-query',
    ],
  },
};

export default nextConfig;
