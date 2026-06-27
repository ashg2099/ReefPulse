'use client'
import { useEffect } from 'react'
import { useReefStore } from '@/lib/store'
import type { Tab } from '@/lib/store'

const TABS: Tab[] = ['Overview', 'Forecast', 'History', 'Alerts', 'Species']

export default function Navbar() {
  const { isDark, toggleDark, activeTab, setActiveTab } = useReefStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <nav style={{
      background: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(2,132,199,0.35)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1 Q11 4 11 8 Q11 12 8 15 Q5 12 5 8 Q5 4 8 1Z" fill="white"/>
            <path d="M4 8 Q6 5.5 8 8 Q10 10.5 12 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>ReefPulse</span>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginLeft: '4px' }}>AI</span>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            fontSize: '13px', padding: '6px 16px', borderRadius: '20px',
            border: 'none', cursor: 'pointer',
            background: activeTab === tab ? 'var(--accent)' : 'transparent',
            color: activeTab === tab ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === tab ? 600 : 400,
            boxShadow: activeTab === tab ? '0 2px 8px rgba(2,132,199,0.3)' : 'none',
            transition: 'all 0.15s',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Live indicator + dark mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px',
          color: 'var(--chip-color)', fontWeight: 500,
          background: 'var(--chip-bg)', border: '0.5px solid var(--chip-border)',
          padding: '5px 12px', borderRadius: '20px',
        }}>
          <div style={{ position: 'relative', width: '7px', height: '7px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)' }}/>
            <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', border: '1.5px solid var(--accent)', animation: 'pulse-ring 1.8s ease-out infinite' }}/>
          </div>
          3 sources live
        </div>
        <button onClick={toggleDark} title={isDark ? 'Light mode' : 'Dark mode'} style={{
          width: '36px', height: '36px', borderRadius: '10px',
          border: '1px solid var(--border)', background: 'var(--bg-card)',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}