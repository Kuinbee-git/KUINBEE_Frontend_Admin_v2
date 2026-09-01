'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            alignItems: 'center',
            background: 'Canvas',
            color: 'CanvasText',
            display: 'flex',
            fontFamily: 'system-ui, sans-serif',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem',
          }}
        >
          <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
            <h1>Admin panel unavailable</h1>
            <p>The application shell could not start. Retry the request to recover.</p>
            {error.digest ? <p>Reference: {error.digest}</p> : null}
            <button type="button" onClick={reset} style={{ padding: '0.75rem 1rem' }}>
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
