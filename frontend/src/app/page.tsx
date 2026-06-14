import Link from 'next/link'
import Logo from '@/components/Logo'
import FloatingShapes from '@/components/FloatingShapes'

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh', width: '100%',
      background: '#F2EDE6', display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    }}>

      <nav style={{
        height: '56px', borderBottom: '1.5px solid #1C1208',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 48px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo variant="light" size={36} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1C1208', letterSpacing: '3px' }}>
            SETHU
          </span>
        </div>
        <div style={{ display: 'flex' }}>
          <Link href="/login" style={{
            padding: '7px 20px', fontSize: '10px', fontWeight: 700,
            letterSpacing: '1.5px', color: '#1C1208', textDecoration: 'none',
            border: '1.5px solid #1C1208', borderRight: 'none', background: 'transparent'
          }}>SIGN IN</Link>
          <Link href="/signup" style={{
            padding: '7px 20px', fontSize: '10px', fontWeight: 700,
            letterSpacing: '1.5px', color: '#F2EDE6', textDecoration: 'none',
            border: '1.5px solid #1C1208', background: '#1C1208'
          }}>GET STARTED</Link>
        </div>
      </nav>

      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '0 48px',
        borderBottom: '1.5px solid #1C1208',
        position: 'relative', overflow: 'hidden',
      }}>
        <FloatingShapes sides="right" />

        <div style={{
          fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: '#D94F00',
          marginBottom: '28px',
          opacity: 0, animation: 'sethuFadeUp 0.6s ease-out forwards',
        }}>
          CBIT · CAMPUS PLATFORM · 2025
        </div>

        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 700,
          color: '#1C1208', letterSpacing: '2px',
          lineHeight: 1, margin: 0,
          opacity: 0, animation: 'sethuFadeUp 0.6s ease-out 0.1s forwards',
        }}>
          YOUR CAMPUS,<br />ORGANISED.
        </h1>

        <div style={{
          height: '3px', background: '#D94F00', margin: '20px 0 24px',
          width: 0, animation: 'sethuDrawLine 0.8s ease-out 0.4s forwards',
        }} />

        <p style={{
          fontSize: '18px', color: '#6A4A2A',
          fontStyle: 'italic', lineHeight: 1.6,
          maxWidth: '480px', margin: '0 0 8px',
          opacity: 0, animation: 'sethuFadeUp 0.6s ease-out 0.3s forwards',
        }}>
          &ldquo;An investment in knowledge pays the best interest.&rdquo;
        </p>
        <div style={{
          fontSize: '10px', color: '#8A6A4A', letterSpacing: '2px', marginBottom: '40px',
          opacity: 0, animation: 'sethuFadeUp 0.6s ease-out 0.35s forwards',
        }}>
          — BENJAMIN FRANKLIN
        </div>

        <div style={{
          display: 'flex',
          opacity: 0, animation: 'sethuFadeUp 0.6s ease-out 0.5s forwards',
        }}>
          <Link href="/signup" style={{
            padding: '13px 32px', fontSize: '10px', fontWeight: 700,
            letterSpacing: '2px', color: '#F2EDE6', textDecoration: 'none',
            background: '#1C1208', border: '1.5px solid #1C1208'
          }}>GET STARTED →</Link>
          <Link href="/login" style={{
            padding: '13px 32px', fontSize: '10px', fontWeight: 700,
            letterSpacing: '2px', color: '#1C1208', textDecoration: 'none',
            background: 'transparent', border: '1.5px solid #1C1208', borderLeft: 'none'
          }}>SIGN IN</Link>
        </div>
      </section>

      <footer style={{
        height: '44px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 48px'
      }}>
        <span style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1px' }}>SETHU — CBIT · 2025</span>
        <span style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1px' }}>AI &amp; ML DEPT</span>
      </footer>

    </main>
  )
}
