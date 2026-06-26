'use client'
import { useEffect, useRef, useState } from 'react'

interface MetricCardProps {
  icon: string; iconBg: string; label: string
  value: string; unit: string; barWidth: number
  barColor?: string; delay?: number; description?: string
  status?: 'safe' | 'watch' | 'alert'
}

const STATUS = {
  safe:  { bg: 'var(--chip-bg)',  color: 'var(--chip-color)',  border: 'var(--chip-border)', label: 'Safe'  },
  watch: { bg: '#fff7ed',         color: '#c2410c',            border: '#fed7aa',            label: 'Watch' },
  alert: { bg: '#fef2f2',         color: '#b91c1c',            border: '#fecaca',            label: 'Alert' },
}

export default function MetricCard({
  icon, iconBg, label, value, unit, barWidth,
  barColor = '#0284c7', delay = 0, description, status,
}: MetricCardProps) {
  const s = status ? STATUS[status] : null
  const prevValue = useRef(value)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (value !== prevValue.current) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 600)
      prevValue.current = value
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <div className="g-card" style={{ padding: '18px 20px', animation: `fade-in-up 0.4s ease ${delay}ms both` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
          }}>{icon}</div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="mono" style={{
                fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1,
                padding: '0 4px', borderRadius: '4px',
                transition: 'background 0.4s ease',
                background: flash ? 'rgba(56,189,248,0.18)' : 'transparent',
              }}>{value}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</span>
            </div>
          </div>
        </div>
        {s && (
          <span style={{
            fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
            background: s.bg, color: s.color, border: `1px solid ${s.border}`, flexShrink: 0,
          }}>{s.label}</span>
        )}
      </div>

      <div style={{ height: '5px', background: 'var(--accent-bg)', borderRadius: '3px', overflow: 'hidden', marginBottom: description ? '10px' : '0' }}>
        <div style={{
          height: '100%', borderRadius: '3px', background: barColor,
          ['--bar-w' as string]: `${barWidth}%`,
          animation: `bar-grow 1s ease ${delay + 300}ms both`,
        }}/>
      </div>

      {description && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{description}</p>
      )}
    </div>
  )
}