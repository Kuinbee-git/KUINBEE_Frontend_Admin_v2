'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface WorkloadCardProps {
  label: string;
  count: number | null;
  onClick?: () => void;
  isLoading?: boolean;
}

function WorkloadCardComponent({ label, count, onClick, isLoading = false }: WorkloadCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || count === null || !onClick}
      className="group w-full rounded-xl text-left outline-none transition-transform enabled:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:cursor-default"
      aria-label={count === null ? `${label}: unavailable` : `${label}: ${count}`}
    >
      <Card
        className="h-full transition-shadow group-hover:shadow-md group-disabled:shadow-none"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <CardContent className="p-5">
          <div
            className="mb-1 min-h-8 text-2xl font-semibold tabular-nums"
            style={{ color: 'var(--state-info)' }}
          >
            {isLoading ? (
              <span className="inline-block h-7 w-10 animate-pulse rounded bg-current opacity-15" />
            ) : (
              (count ?? '—')
            )}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export const WorkloadCard = memo(WorkloadCardComponent);
