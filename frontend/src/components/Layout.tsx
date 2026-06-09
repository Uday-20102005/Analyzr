import { useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f4f0', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e4e3dd',
        boxShadow: '0 1px 3px rgba(20,20,18,0.06)',
      }}>
        <div style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '0 2.5rem',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #e8572a 0%, #c73f14 100%)',
              border: '1px solid #c73f14',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(232,87,42,0.30)',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#fff',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                A
              </span>
            </div>
            <div>
              <h1 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                color: '#141412',
                margin: 0,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}>
                Analyzr
              </h1>
              <p style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#b8b7b0',
                margin: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginTop: 2,
              }}>
                Data Intelligence
              </p>
            </div>
          </div>

          {/* Right side pill */}
         

        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ position: 'relative' }}>{children}</main>

      {/* ── Footer ── */}
      {!isHome && (
        <footer style={{
          borderTop: '1px solid #e4e3dd',
          backgroundColor: '#fff',
        }}>
          <div style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '1.25rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 400,
              color: '#c8c7c0',
              margin: 0,
              letterSpacing: '0.01em',
            }}>
              © 2025 Analyzr. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}