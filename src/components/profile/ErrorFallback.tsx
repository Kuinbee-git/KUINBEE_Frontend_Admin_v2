interface ErrorFallbackProps {
  message?: string;
  description?: string;
}

export function ErrorFallback({ 
  message = 'Failed to load profile', 
  description = 'Please try refreshing the page.' 
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="text-center">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
    </div>
  );
}
