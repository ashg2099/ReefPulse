'use client'

export default function HeroOcean() {
  const bubbles = [
    { left: '40px',  bottom: '35px', size: 6, delay: '0s',   dur: '2.5s' },
    { left: '58px',  bottom: '22px', size: 4, delay: '0.8s', dur: '3s'   },
    { right: '55px', bottom: '30px', size: 7, delay: '1.2s', dur: '2.8s' },
    { right: '40px', bottom: '20px', size: 5, delay: '0.4s', dur: '3.2s' },
    { left: '50%',   bottom: '18px', size: 4, delay: '1.8s', dur: '2.2s' },
  ]

  return (
    <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>

      {/* Real coral reef photo */}
      <img
        src="https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=1920&q=80"
        alt="Great Barrier Reef coral reef"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 40%',
          zIndex: 0,
        }}
      />

      {/* Gradient overlay — dark top, fades to page background at bottom */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg, rgba(2,20,50,0.72) 0%, rgba(4,44,83,0.55) 45%, rgba(225,245,238,1) 100%)',
      }} />

      {/* Wave 1 */}
      <div style={{ position: 'absolute', width: '200%', height: '40px', bottom: '28px', zIndex: 2 }}>
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" width="100%" height="40"
          style={{ animation: 'wave 8s linear infinite' }}>
          <path d="M0,20 C120,35 240,5 360,20 C480,35 600,5 720,20 C840,35 960,5 1080,20 C1200,35 1320,5 1440,20 L1440,40 L0,40Z"
            fill="rgba(225,245,238,0.45)" />
        </svg>
      </div>

      {/* Wave 2 */}
      <div style={{ position: 'absolute', width: '200%', height: '35px', bottom: '8px', zIndex: 2 }}>
        <svg viewBox="0 0 1440 35" preserveAspectRatio="none" width="100%" height="35"
          style={{ animation: 'wave-reverse 6s linear infinite' }}>
          <path d="M0,18 C180,30 360,5 540,18 C720,31 900,5 1080,18 C1260,31 1380,5 1440,15 L1440,35 L0,35Z"
            fill="rgba(225,245,238,0.8)" />
        </svg>
      </div>

      {/* Wave 3 — solid page bg colour */}
      <div style={{ position: 'absolute', width: '200%', height: '30px', bottom: 0, zIndex: 2 }}>
        <svg viewBox="0 0 1440 30" preserveAspectRatio="none" width="100%" height="30"
          style={{ animation: 'wave 5s linear infinite' }}>
          <path d="M0,15 C90,24 180,6 270,15 C360,24 450,6 540,15 C630,24 720,6 810,15 C900,24 990,6 1080,15 C1170,24 1260,6 1350,15 L1440,12 L1440,30 L0,30Z"
            fill="#E1F5EE" />
        </svg>
      </div>

      {/* Coral — left */}
      <svg style={{ position: 'absolute', bottom: 22, left: '18px', zIndex: 3, transformOrigin: 'bottom center', animation: 'coral-sway 4s ease-in-out infinite' }}
        width="32" height="70" viewBox="0 0 32 70">
        <path d="M16 70 L16 45 Q8 36 10 24 Q12 12 16 17 Q20 12 22 24 Q24 36 16 45Z" fill="#D4537E" opacity="0.95"/>
        <circle cx="16" cy="17" r="4" fill="#F4C0D1" />
        <path d="M16 50 Q6 42 3 30 Q1 20 6 23 Q11 26 12 36Z" fill="#ED93B1" />
        <path d="M16 50 Q26 42 29 30 Q31 20 26 23 Q21 26 20 36Z" fill="#ED93B1" />
      </svg>

      <svg style={{ position: 'absolute', bottom: 22, left: '60px', zIndex: 3, transformOrigin: 'bottom center', animation: 'coral-sway-r 5s ease-in-out infinite' }}
        width="22" height="50" viewBox="0 0 22 50">
        <path d="M11 50 L11 28 Q5 22 6 14 Q8 6 11 10 Q14 6 16 14 Q17 22 11 28Z" fill="#5DCAA5"/>
        <circle cx="11" cy="10" r="3" fill="#9FE1CB" />
      </svg>

      {/* Coral — right */}
      <svg style={{ position: 'absolute', bottom: 22, right: '20px', zIndex: 3, transformOrigin: 'bottom center', animation: 'coral-sway-r 3.5s ease-in-out infinite' }}
        width="28" height="65" viewBox="0 0 28 65">
        <path d="M14 65 L14 40 Q6 32 8 20 Q10 8 14 13 Q18 8 20 20 Q22 32 14 40Z" fill="#EF9F27"/>
        <circle cx="14" cy="13" r="4" fill="#FAC775" />
        <path d="M14 45 Q4 37 2 26 Q0 16 5 19 Q10 22 11 32Z" fill="#BA7517" />
        <path d="M14 45 Q24 37 26 26 Q28 16 23 19 Q18 22 17 32Z" fill="#BA7517" />
      </svg>

      <svg style={{ position: 'absolute', bottom: 22, right: '65px', zIndex: 3, transformOrigin: 'bottom center', animation: 'coral-sway 6s ease-in-out infinite' }}
        width="18" height="45" viewBox="0 0 18 45">
        <path d="M9 45 L9 25 Q3 19 4 11 Q6 3 9 7 Q12 3 14 11 Q15 19 9 25Z" fill="#D4537E"/>
        <circle cx="9" cy="7" r="3" fill="#F4C0D1" />
      </svg>

      {/* Fish */}
      <div style={{ position: 'absolute', top: '80px', zIndex: 3, animation: 'fish-swim 12s linear infinite' }}>
        <svg width="28" height="16" viewBox="0 0 28 16">
          <path d="M28 8 L18 1 L18 5 L4 5 Q0 8 4 11 L18 11 L18 15 Z" fill="white" opacity="0.9"/>
          <circle cx="6" cy="8" r="1.5" fill="#185FA5" />
        </svg>
      </div>
      <div style={{ position: 'absolute', top: '115px', zIndex: 3, animation: 'fish-swim-r 18s linear 6s infinite' }}>
        <svg width="22" height="12" viewBox="0 0 22 12">
          <path d="M22 6 L14 1 L14 4 L3 4 Q0 6 3 8 L14 8 L14 11 Z" fill="#FFD700" opacity="0.85"/>
          <circle cx="5" cy="6" r="1.2" fill="rgba(255,140,0,0.8)" />
        </svg>
      </div>

      {/* Bubbles */}
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', zIndex: 3,
          width: b.size, height: b.size, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.5)',
          background: 'rgba(255,255,255,0.12)',
          bottom: b.bottom,
          left: (b as any).left, right: (b as any).right,
          animation: `bubble-rise ${b.dur} ease-in ${b.delay} infinite`,
        }} />
      ))}

      {/* Hero text — white on dark photo */}
      <div style={{
        position: 'absolute', top: '44%', left: '50%',
        transform: 'translate(-50%, -55%)',
        textAlign: 'center', zIndex: 4,
      }}>
        {/* Frosted glass pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', color: 'rgba(255,255,255,0.92)',
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '0.5px solid rgba(255,255,255,0.3)',
          padding: '5px 14px', borderRadius: '20px', marginBottom: '12px',
        }}>
          📍 Queensland, Australia · SDG 14: Life Below Water
        </div>

        <div style={{
          fontSize: '30px', fontWeight: 700, color: 'white',
          textShadow: '0 2px 24px rgba(0,0,0,0.45)',
          letterSpacing: '-0.5px', lineHeight: 1.2,
        }}>
          Central Great Barrier Reef
        </div>

        <div style={{
          fontSize: '13px', color: 'rgba(255,255,255,0.78)',
          marginTop: '8px',
          textShadow: '0 1px 10px rgba(0,0,0,0.35)',
        }}>
          18.0°S · 147.0°E · AI-powered marine health monitoring
        </div>
      </div>
    </div>
  )
}