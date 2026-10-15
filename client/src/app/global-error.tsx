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
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0a0a0f',
          color: '#ffffff',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '480px', padding: '24px' }}>
          <div style={{ marginBottom: '20px', color: '#ef4444' }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto', display: 'block' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 12px' }}>
            Critical Application Error
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5, margin: '0 0 24px' }}>
            The application encountered a critical runtime error. Please refresh the page to continue.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
