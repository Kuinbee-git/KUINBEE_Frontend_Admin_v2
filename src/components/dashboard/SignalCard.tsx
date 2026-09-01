'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

type SignalStatus = 'warning' | 'info' | 'error' | 'success';

interface SignalCardProps {
  label: string;
  count: number | null;
  status: SignalStatus;
  icon: LucideIcon;
  onClick?: () => void;
  isLoading?: boolean;
}

const getStatusStyles = (status: SignalStatus) => {
  switch (status) {
    case 'warning':
      return {
        color: 'var(--status-warning)',
        bgColor: 'var(--status-warning-bg)',
        borderColor: 'var(--status-warning-border)',
      };
    case 'info':
      return {
        color: 'var(--status-info)',
        bgColor: 'var(--status-info-bg)',
        borderColor: 'var(--status-info-border)',
      };
    case 'error':
      return {
        color: 'var(--status-error)',
        bgColor: 'var(--status-error-bg)',
        borderColor: 'var(--status-error-border)',
      };
    case 'success':
      return {
        color: 'var(--status-success)',
        bgColor: 'var(--status-success-bg)',
        borderColor: 'var(--status-success-border)',
      };
  }
};

function SignalCardComponent({
  label,
  count,
  status,
  icon: Icon,
  onClick,
  isLoading = false,
}: SignalCardProps) {
  const styles = useMemo(() => getStatusStyles(status), [status]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || count === null || !onClick}
      className="group w-full rounded-xl text-left outline-none transition-transform enabled:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:cursor-default"
      aria-label={count === null ? `${label}: unavailable` : `${label}: ${count}`}
    >
      <Card
        className="h-full transition-shadow group-hover:shadow-lg group-disabled:shadow-none"
        style={{
          backgroundColor: styles.bgColor,
          borderColor: styles.borderColor,
        }}
      >
        <CardContent className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg p-2" style={{ backgroundColor: styles.bgColor }}>
              <Icon className="h-4 w-4" style={{ color: styles.color }} aria-hidden="true" />
            </div>
          </div>
          <div
            className="mb-1 min-h-9 text-3xl font-semibold tabular-nums"
            style={{ color: styles.color }}
          >
            {isLoading ? (
              <span className="inline-block h-8 w-12 animate-pulse rounded bg-current opacity-15" />
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

export const SignalCard = memo(SignalCardComponent);
