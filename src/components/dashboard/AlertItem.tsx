'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface AlertItemProps {
  title: string;
  message: string;
  href: string;
  severity: 'info' | 'warning' | 'error';
}

const alertStyles = {
  info: { color: 'var(--status-info)', background: 'var(--status-info-bg)' },
  warning: { color: 'var(--status-warning)', background: 'var(--status-warning-bg)' },
  error: { color: 'var(--status-error)', background: 'var(--status-error-bg)' },
} as const;

function AlertItemComponent({ title, message, href, severity }: AlertItemProps) {
  const style = alertStyles[severity];
  return (
    <Link
      href={href}
      className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
    >
      <Alert
        className="transition-transform group-hover:-translate-y-0.5"
        style={{ backgroundColor: style.background, borderColor: style.color }}
      >
        <AlertCircle className="h-4 w-4" style={{ color: style.color }} aria-hidden="true" />
        <AlertDescription className="flex items-start justify-between gap-4 text-sm">
          <span>
            <span className="block font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </span>
            <span className="mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </span>
          </span>
          <ArrowRight
            className="mt-1 h-4 w-4 shrink-0"
            style={{ color: style.color }}
            aria-hidden="true"
          />
        </AlertDescription>
      </Alert>
    </Link>
  );
}

export const AlertItem = memo(AlertItemComponent);
