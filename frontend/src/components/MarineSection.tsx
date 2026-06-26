'use client'
import { useQuery } from '@tanstack/react-query'
import { getSnapshot } from '@/lib/api'
import { useReefStore } from '@/lib/store'
import MetricCard from './MetricCard'

export default function MarineSection() {
  const { selectedLocation } = useReefStore()
  const { data, isLoading } = useQuery({
    queryKey: ['snapshot', selectedLocation.lat, selectedLocation.lon],
    queryFn: () => getSnapshot(selectedLocation.lat, selectedLocation.lon),
    staleTime: 60_000, retry: 1,
  })

  const pct = (v: number | undefined, max: number) =>
    v != null ? Math.min(Math.round((v / max) * 100), 100) : 0

  return (
    <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '18px' }}>🌊</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Marine Conditions</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '700px' }}>
          Wave energy, swell patterns, wind and humidity all affect reef health. Moderate wave action
          oxygenates the water column; extreme events can physically damage coral structures.
        </p>
      </div>

      {isLoading && <p style={{ color: 'var(--text-subtle)', fontSize: '13px' }}>Fetching marine data…</p>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <MetricCard
            icon="〰️" iconBg="var(--accent-bg)" label="Wave Height"
            value={data.marine_conditions.wave_height_m?.toFixed(1) ?? '—'} unit="m"
            barWidth={pct(data.marine_conditions.wave_height_m, 6)} barColor="#0284c7"
            description="Above 3 m can dislodge coral fragments; below 2 m aids oxygenation without physical stress."
            delay={0}
          />
          <MetricCard
            icon="🌀" iconBg="#ede9fe" label="Swell Height"
            value={data.marine_conditions.swell_wave_height_m?.toFixed(1) ?? '—'} unit="m"
            barWidth={pct(data.marine_conditions.swell_wave_height_m, 5)} barColor="#7c3aed"
            description="Long-period ocean swells from distant storms. Large swell (>2.5 m) reduces light penetration."
            delay={80}
          />
          <MetricCard
            icon="💨" iconBg="#fff7ed" label="Wind & Humidity"
            value={`${data.weather.wind_speed_kmh ?? '—'}`} unit={`km/h ${data.weather.wind_direction ?? ''}`}
            barWidth={pct(data.weather.wind_speed_kmh, 80)} barColor="#f59e0b"
            description={`Humidity: ${data.weather.humidity_pct ?? '—'} %. Trade winds >40 km/h promote upwelling of cooler water.`}
            delay={160}
          />
        </div>
      )}
    </section>
  )
}