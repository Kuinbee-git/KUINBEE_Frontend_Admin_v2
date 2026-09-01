import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  onBack,
  backLabel = 'Go back',
}: PageHeaderProps) {
  return (
    <header
      className="border-b px-4 py-5 sm:px-6"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-0.5 h-9 w-9 shrink-0"
              onClick={onBack}
              aria-label={backLabel}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {description ? (
              <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {description}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="w-full shrink-0 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
