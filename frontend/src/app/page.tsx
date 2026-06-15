'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import FloatingShapes from '@/components/FloatingShapes'
import StudentDeskScene from '@/components/StudentDeskScene'

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
        justifyContent: 'space-between', padding: '0 clamp(16px, 5vw, 48px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo variant="light" size={36} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1C1208', letterSpacing: '3px' }}>
            SETHU
          </span>
        </div>
        <div style={{ display: 'flex' }}>
          <Link href="/login" style={{
            padding: 'clamp(5px,1.5vw,7px) clamp(10px,3vw,20px)',
            fontSize: 'clamp(8px,2vw,10px)', fontWeight: 700,
            letterSpacing: 'clamp(0.5px,0.3vw,1.5px)', color: '#1C1208', textDecoration: 'none',
            border: '1.5px solid #1C1208', borderRight: 'none', background: 'transparent'
          }}>SIGN IN</Link>
          <Link href="/signup" style={{
            padding: 'clamp(5px,1.5vw,7px) clamp(10px,3vw,20px)',
            fontSize: 'clamp(8px,2vw,10px)', fontWeight: 700,
            letterSpacing: 'clamp(0.5px,0.3vw,1.5px)', color: '#F2EDE6', textDecoration: 'none',
            border: '1.5px solid #1C1208', background: '#1C1208'
          }}>GET STARTED</Link>
        </div>
      </nav>

      <section className="sethu-hero">
        <FloatingShapes />

        <div className="sethu-hero-text">
          <div style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: '#D94F00',
            marginBottom: '12px',
            opacity: 0, animation: 'sethuFadeUp 0.6s ease-out forwards',
          }}>
            CBIT · CAMPUS PLATFORM · 2025
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 700,
            color: '#1C1208', letterSpacing: '2px',
            lineHeight: 1, margin: 0,
            opacity: 0, animation: 'sethuFadeUp 0.6s ease-out 0.1s forwards',
          }}>
            YOUR CAMPUS,<br />ORGANISED.
          </h1>

          <div style={{
            fontSize: '11px', color: '#8A6A4A', letterSpacing: '1px',
            marginTop: '14px', marginBottom: '16px', maxWidth: '420px', lineHeight: 1.6,
            opacity: 0, animation: 'sethuFadeUp 0.6s ease-out 0.2s forwards',
          }}>
            <strong style={{ color: '#1C1208' }}>S</strong>mart{' '}
            <strong style={{ color: '#1C1208' }}>E</strong>ducation and{' '}
            <strong style={{ color: '#1C1208' }}>T</strong>ask{' '}
            <strong style={{ color: '#1C1208' }}>H</strong>ub for{' '}
            <strong style={{ color: '#1C1208' }}>U</strong>nified Campus Management
          </div>

          <div style={{
            height: '3px', background: '#D94F00', margin: '8px 0 24px',
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
        </div>

        <div className="sethu-hero-scene">
          <StudentDeskScene />
        </div>
      </section>

      <footer style={{
        height: '44px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 clamp(16px, 5vw, 48px)'
      }}>
        <span style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1px' }}>SETHU — CBIT · 2025</span>
        <span style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1px' }}>AI &amp; ML DEPT</span>
      </footer>

      <style jsx>{`
        .sethu-hero {
          flex: 1;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 32px;
          padding: 48px;
          border-bottom: 1.5px solid #1C1208;
          position: relative;
          overflow: hidden;
        }
        .sethu-hero-text {
          flex: 1 1 0;
          min-width: 0;
        }
        .sethu-hero-scene {
          flex: 1 1 0;
          min-width: 0;
          height: 380px;
        }
        @media (max-width: 900px) {
          .sethu-hero {
            flex-direction: column;
            align-items: stretch;
            padding: 32px 20px;
            gap: 16px;
          }
          .sethu-hero-scene {
            order: -1;
            width: 100%;
            height: 260px;
          }
          .sethu-hero-text {
            width: 100%;
          }
        }
        @media (max-width: 480px) {
          .sethu-hero {
            padding: 24px 16px;
          }
          .sethu-hero-scene {
            height: 200px;
          }
        }
      `}</style>
    </main>
  )
}