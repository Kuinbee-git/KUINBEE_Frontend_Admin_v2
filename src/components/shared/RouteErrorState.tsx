'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RouteErrorStateProps {
  title?: string;
  message?: string;
  digest?: string;
  reset: () => void;
  homeHref?: string;
}

export function RouteErrorState({
  title = 'This page could not be displayed',
  message = 'An unexpected application error interrupted this view. Retry without losing your signed-in session.',
  digest,
  reset,
  homeHref = '/dashboard',
}: RouteErrorStateProps) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--bg-surface)] p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-warning-bg)]">
            <AlertTriangle className="h-6 w-6 text-[var(--status-warning)]" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
          {digest ? (
            <p className="mt-3 text-xs text-[var(--text-muted)]">Reference: {digest}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link href={homeHref}>Return to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
