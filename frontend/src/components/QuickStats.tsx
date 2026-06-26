'use client'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSnapshot } from '@/lib/api'
import { useReefStore } from '@/lib/store'

// ── Animated value that flashes teal when the number changes ──
function AnimatedValue({ value, decimals = 2 }: { value: number | undefined; decimals?: number }) {
  const prev = useRef(value)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (value !== prev.current && value != null) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 600)
      prev.current = value
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <span className="mono" style={{
      fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)',
      padding: '1px 5px', borderRadius: '5px',
      transition: 'background 0.4s ease',
      background: flash ? 'rgba(56,189,248,0.18)' : 'transparent',
      display: 'inline-block',
    }}>
      {value != null ? value.toFixed(decimals) : '—'}
    </span>
  )
}

// ── Skeleton placeholder for one card ──
function SkeletonCard({ wide }: { wide?: boolean }) {
  return (
    <div className="g-card" style={{
      padding: '20px',
      gridColumn: wide ? 'span 2' : 'span 1',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      {/* Icon + label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="skeleton" style={{ width: '22px', height: '22px', borderRadius: '4px' }}/>
        <div className="skeleton" style={{ width: wide ? '160px' : '100px', height: '10px' }}/>
      </div>
      {/* Value */}
      <div className="skeleton" style={{ width: wide ? '120px' : '80px', height: '28px' }}/>
      {/* Bar */}
      <div className="skeleton" style={{ width: '100%', height: '3px' }}/>
      {/* Note */}
      <div className="skeleton" style={{ width: '85%', height: '10px' }}/>
    </div>
  )
}

// ── Real data card ──
function StatCard({ icon, label, value, unit, decimals = 2, color, note, wide }: {
  icon: string; label: string; value: number | undefined
  unit: string; decimals?: number; color: string; note: string; wide?: boolean
}) {
  const barW = value != null ? Math.min((value / 35) * 100, 100) : 0

  return (
    <div className="g-card" style={{
      padding: '20px',
      gridColumn: wide ? 'span 2' : 'span 1',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <AnimatedValue value={value} decimals={decimals} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      <div style={{ height: '3px', background: 'var(--accent-bg)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: color, borderRadius: '2px',
          ['--bar-w' as string]: `${barW}%`,
          animation: 'bar-grow 1.2s ease both',
        }}/>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5 }}>{note}</p>
    </div>
  )
}

export default function QuickStats() {
  const { selectedLocation } = useReefStore()
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['snapshot', selectedLocation.lat, selectedLocation.lon],
    queryFn: () => getSnapshot(selectedLocation.lat, selectedLocation.lon),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  })

  return (
    <div style={{ padding: '20px 28px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Live snapshot · auto-refreshes every 60 s
        </p>

        {/* Fetching notice — only visible while loading */}
        {(isLoading || (isFetching && !data)) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', color: 'var(--accent)', fontWeight: 500,
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            padding: '5px 12px', borderRadius: '20px',
            animation: 'fade-in-up 0.3s ease',
          }}>
            {/* Spinning arc */}
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
              <circle cx="6" cy="6" r="5" fill="none" stroke="var(--accent-border)" strokeWidth="2"/>
              <path d="M6 1 A5 5 0 0 1 11 6" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Fetching live data from NOAA &amp; BOM…
          </div>
        )}

        {isError && (
          <div style={{
            fontSize: '12px', color: '#b91c1c', fontWeight: 500,
            background: '#fef2f2', border: '1px solid #fecaca',
            padding: '5px 12px', borderRadius: '20px',
          }}>
            ⚠️ Could not reach data sources — retrying…
          </div>
        )}

        {/* Subtle "updated" flash when fresh data arrives */}
        {data && !isFetching && (
          <div style={{
            fontSize: '11px', color: 'var(--text-subtle)',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}/>
            Updated just now
          </div>
        )}
      </div>

      {/* Bento grid — skeleton while loading, real cards once data arrives */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {isLoading ? (
          // Skeleton placeholders match the real layout exactly
          <>
            <SkeletonCard wide />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard wide icon="🌡️" label="Sea Surface Temperature"
              value={data?.thermal_stress.sst_celsius} unit="°C" decimals={2} color="#0284c7"
              note="Bleaching begins above 28–29 °C for sustained periods" />
            <StatCard icon="☀️" label="Heating Weeks"
              value={data?.thermal_stress.dhw_celsius_weeks} unit="°C-wks" decimals={1} color="#f59e0b"
              note="Risk above 4 °C-weeks" />
            <StatCard icon="〰️" label="Wave Height"
              value={data?.marine_conditions.wave_height_m} unit="m" decimals={1} color="#0891b2"
              note="Physical stress above 3 m" />
            <StatCard icon="💨" label="Wind Speed"
              value={data?.weather.wind_speed_kmh} unit="km/h" decimals={0} color="#6366f1"
              note="Trade winds cool the surface" />
          </>
        )}
      </div>
    </div>
  )
}