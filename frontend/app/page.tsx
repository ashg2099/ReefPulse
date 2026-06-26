import Navbar from '@/components/Navbar'
import TabContent from '@/components/TabContent'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', position: 'relative' }}>

      {/* Fixed aurora blobs — decorative background */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '650px', height: '650px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 70%)', top: '-120px', left: '-120px', animation: 'aurora-1 14s ease-in-out infinite' }}/>
        <div style={{ position: 'absolute', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', bottom: '160px', right: '-90px', animation: 'aurora-2 17s ease-in-out infinite' }}/>
        <div style={{ position: 'absolute', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,132,199,0.08) 0%, transparent 70%)', top: '55%', left: '38%', animation: 'aurora-1 20s ease-in-out infinite reverse' }}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <TabContent />
      </div>
    </div>
  )
}