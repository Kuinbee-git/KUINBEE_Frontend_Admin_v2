import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorFallback({
  message = 'Failed to load profile',
  description = 'The profile service is temporarily unavailable.',
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="text-center">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
        {onRetry ? (
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
