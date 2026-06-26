'use client'
import SSTChart from './SSTChart'

const SPECIES = [
  { name: 'Acropora (branching)', risk: 12, note: 'Most heat-sensitive — bleaches first above 28 °C' },
  { name: 'Montipora',            risk: 8,  note: 'Moderately sensitive; plate and encrusting forms' },
  { name: 'Massive Porites',      risk: 5,  note: 'Most resilient — can survive brief thermal events' },
  { name: 'Soft corals',          risk: 15, note: 'Highly variable; some species very heat-sensitive' },
]

const SOURCES = [
  { name: 'NOAA Coral Reef Watch', desc: 'Satellite SST & bleaching alerts' },
  { name: 'Open-Meteo Marine API', desc: 'Wave height, swell & period' },
  { name: 'Bureau of Meteorology', desc: 'Wind, humidity & air temperature' },
]

export default function RightPanel() {
  return (
    <>
      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '18px' }}>📈</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>7-Day SST Trend</h2>
        </div>
        <div className="g-card" style={{ padding: '20px' }}><SSTChart /></div>
      </section>

      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <span style={{ fontSize: '18px' }}>🐠</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Species Stress Index</h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current thermal stress relative to each species' bleaching threshold.</p>
        </div>
        {SPECIES.map((s, i) => (
          <div key={s.name} className="g-card" style={{ padding: '14px 16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '7px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px', background: 'var(--chip-bg)', color: 'var(--chip-color)', border: '1px solid var(--chip-border)' }}>Safe</span>
            </div>
            <div style={{ height: '4px', background: 'var(--accent-bg)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: '3px', ['--bar-w' as string]: `${s.risk}%`, animation: `bar-grow 1s ease ${400 + i * 80}ms both` }}/>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-subtle)', lineHeight: 1.5 }}>{s.note}</p>
          </div>
        ))}
      </section>

      <section style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '18px' }}>🛰️</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Data Sources</h2>
        </div>
        {SOURCES.map((src) => (
          <div key={src.name} className="g-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', marginBottom: '10px' }}>
            <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}/>
              <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', border: '1.5px solid var(--accent)', opacity: 0.4, animation: 'pulse-ring 2.5s ease-out infinite' }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{src.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>{src.desc}</div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'var(--chip-bg)', color: 'var(--chip-color)', border: '1px solid var(--chip-border)' }}>Live</span>
          </div>
        ))}
      </section>
    </>
  )
}