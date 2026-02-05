export default function LoadingOverlay({ progress = 0 }) {
  return (
    <div
      className="loading-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0a0a0e 0%, #12121a 50%, #0d0d12 100%)',
        color: '#fff',
        zIndex: 999,
        textAlign: 'center',
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
      }}
    >
      <style>{`
        .loading-overlay .loading-mobile-only {
          display: block;
        }
        @media (min-width: 769px) {
          .loading-overlay .loading-mobile-only {
            display: none;
          }
        }
      `}</style>
      <div style={{ maxWidth: 380, padding: 24 }}>
        <div className="loading-mobile-only" style={{ fontSize: 14, fontWeight: 500, marginBottom: 20, opacity: 0.9, letterSpacing: '0.02em' }}>
          This experience works best on a computer
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em' }}>
          Loading… {Math.round(progress)}%
        </div>
        <div
          style={{
            height: 8,
            width: '100%',
            maxWidth: 260,
            margin: '0 auto',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 999,
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, progress))}%`,
              background: 'linear-gradient(90deg, #7C6CF6 0%, #9b8aff 100%)',
              borderRadius: 999,
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 20px rgba(124, 108, 246, 0.4)'
            }}
          />
        </div>
      </div>
    </div>
  )
}
