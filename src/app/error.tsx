'use client';

import { RouteErrorState } from '@/components/shared/RouteErrorState';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState digest={error.digest} reset={reset} />;
}
