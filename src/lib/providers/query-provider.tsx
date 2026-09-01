'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () => import('@tanstack/react-query-devtools').then((module) => module.ReactQueryDevtools),
        { ssr: false }
      )
    : null;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error && typeof error === 'object' && 'statusCode' in error) {
                const statusCode = (error as { statusCode: number }).statusCode;
                if (statusCode >= 400 && statusCode < 500) return false;
              }
              // Retry up to 1 time for other errors
              return failureCount < 1;
            },
          },
          mutations: {
            retry: 0,
            // Global error handler - only for mutations without custom onError
            onError: (error) => {
              // Only show toast if mutation doesn't have custom onError
              const errorMessage = getFriendlyErrorMessage(error);
              toast.error(errorMessage);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
