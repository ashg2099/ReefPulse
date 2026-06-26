'use client'
import { useQuery } from '@tanstack/react-query'
import { getSnapshot } from '@/lib/api'
import { useReefStore } from '@/lib/store'
import MetricCard from './MetricCard'

export default function ThermalSection() {
  const { selectedLocation } = useReefStore()
  const { data, isLoading } = useQuery({
    queryKey: ['snapshot', selectedLocation.lat, selectedLocation.lon],
    queryFn: () => getSnapshot(selectedLocation.lat, selectedLocation.lon),
    staleTime: 60_000, retry: 1,
  })

  const pct = (v: number | undefined, max: number) =>
    v != null ? Math.min(Math.round((v / max) * 100), 100) : 0

  return (
    <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '18px' }}>🌡️</span>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Thermal Stress</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '700px' }}>
          Coral bleaching is driven by elevated sea temperatures. The two key indicators are Sea Surface
          Temperature (SST) and Degree Heating Weeks (DHW) — a cumulative measure of how long the reef
          has been exposed to stressful heat above the local maximum monthly mean.
        </p>
      </div>

      {isLoading && <p style={{ color: 'var(--text-subtle)', fontSize: '13px' }}>Fetching live NOAA data…</p>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <MetricCard
              icon="🌡️" iconBg="var(--accent-bg)" label="Sea Surface Temperature"
              value={data.thermal_stress.sst_celsius?.toFixed(2) ?? '—'} unit="°C"
              barWidth={pct(data.thermal_stress.sst_celsius, 35)} barColor="#0284c7"
              status={data.thermal_stress.sst_celsius > 29 ? 'alert' : data.thermal_stress.sst_celsius > 27 ? 'watch' : 'safe'}
              description="Coral bleaching begins when SST exceeds 28–29 °C for prolonged periods. Below 27 °C is thermally safe."
              delay={0}
            />
            <MetricCard
              icon="📅" iconBg="#fef3c7" label="Degree Heating Weeks"
              value={data.thermal_stress.dhw_celsius_weeks?.toFixed(1) ?? '—'} unit="°C-weeks"
              barWidth={pct(data.thermal_stress.dhw_celsius_weeks, 20)} barColor="#f59e0b"
              status={data.thermal_stress.dhw_celsius_weeks > 8 ? 'alert' : data.thermal_stress.dhw_celsius_weeks > 4 ? 'watch' : 'safe'}
              description="DHW accumulates when SST exceeds the local monthly maximum. Above 4 °C-weeks = bleaching risk; above 8 = probable mortality."
              delay={80}
            />
          </div>

          <div className="g-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <span style={{ fontSize: '26px' }}>{data.thermal_stress.bleaching_alert === 0 ? '✅' : '⚠️'}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                NOAA Bleaching Alert:{' '}
                <span className="mono" style={{ color: 'var(--accent)' }}>{data.thermal_stress.bleaching_status}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                BAA Level <span className="mono">{data.thermal_stress.bleaching_alert}</span> — Scale: 0 (No Stress) → 4 (Alert Level 2). Source: NOAA Coral Reef Watch.
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}