'use client';

import { RouteErrorState } from '@/components/shared/RouteErrorState';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      title="This admin view encountered an error"
      digest={error.digest}
      reset={reset}
    />
  );
}
