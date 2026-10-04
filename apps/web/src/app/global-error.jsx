'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
            background: '#f5f7fa',
            color: '#101828',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#b42318', margin: 0 }}>
            Something went wrong
          </p>
          <h1 style={{ fontSize: '28px', margin: '8px 0 0' }}>We hit a snag</h1>
          <p style={{ maxWidth: '420px', color: '#475467', lineHeight: 1.6 }}>
            An unexpected error occurred. Reload the page, or come back in a moment.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#2b4268',
                color: '#fff',
                border: 0,
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: '#fff',
                color: '#2b4268',
                border: '1px solid #e6eaf1',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go home
            </a>
          </div>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <pre
              style={{
                marginTop: '24px',
                maxWidth: '90vw',
                overflowX: 'auto',
                background: '#fff',
                border: '1px solid #e6eaf1',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#475467',
                textAlign: 'left',
              }}
            >
              {error.message}
            </pre>
          )}
        </main>
      </body>
    </html>
  );
}
