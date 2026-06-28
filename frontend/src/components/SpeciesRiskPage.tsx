'use client'
import { useQuery } from '@tanstack/react-query'
import { useReefStore } from '@/lib/store'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

const STRESS = {
  0: { label: 'No Stress', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badge: '#dcfce7', text: '#15803d' },
  1: { label: 'Watch',     color: '#ca8a04', bg: '#fefce8', border: '#fde68a', badge: '#fef9c3', text: '#854d0e' },
  2: { label: 'Alert',     color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', badge: '#ffedd5', text: '#9a3412' },
  3: { label: 'Severe',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badge: '#fee2e2', text: '#991b1b' },
}

const SENSITIVITY_ICON = { high: '🔴', medium: '🟡', low: '🟢' }

export default function SpeciesRiskPage() {
  const { lat, lon } = useReefStore()
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [sensFilter, setSensFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const forecastQ = useQuery({
    queryKey: ['forecast', lat, lon],
    queryFn: () => fetch(`${API}/forecast?lat=${lat}&lon=${lon}`).then(r => r.json()),
    staleTime: 60_000,
  })

  const sst = forecastQ.data?.current?.sst ?? null
  const dhw = forecastQ.data?.current?.dhw ?? null

  const speciesQ = useQuery({
    queryKey: ['species-risk', lat, lon, sst, dhw],
    queryFn: () => fetch(
      `${API}/species-risk?lat=${lat}&lon=${lon}&current_sst=${sst}&current_dhw=${dhw}`
    ).then(r => r.json()),
    enabled: sst != null,
    staleTime: 120_000,
  })

  const data = speciesQ.data
  const summary = data?.summary

  const filtered = data?.species?.filter((sp: any) => {
    const stressMatch = filter === 'all' || (
      filter === 'high' ? sp.stress_level >= 2 :
      filter === 'medium' ? sp.stress_level === 1 :
      sp.stress_level === 0
    )
    const sensMatch = sensFilter === 'all' || sp.sensitivity === sensFilter
    return stressMatch && sensMatch
  }) ?? []

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>

      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
        padding: '40px 32px 32px', color: 'white',
      }}>
        <div style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px' }}>🪸</span>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Species Bleaching Risk
            </h1>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.85, lineHeight: 1.6, margin: '0 0 20px', maxWidth: '680px' }}>
            Real-time thermal stress assessment for <strong>{summary?.total ?? '—'} coral species</strong> recorded in the Great Barrier Reef via OBIS.
            Risk is calculated from current SST vs each species' bleaching threshold — species bleach when SST exceeds their thermal limit for sustained periods.
          </p>

          {/* Condition pills */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { icon: '🌡️', label: 'Sea Surface Temp', value: sst != null ? `${sst}°C` : '—' },
              { icon: '☀️', label: 'Degree Heating Weeks', value: dhw != null ? `${dhw} °C-wks` : '—' },
              { icon: '📍', label: 'Location', value: `${Math.abs(lat)}°S · ${lon}°E` },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: '10px',
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        }}>
          {[
            { key: 'no_stress', level: 0, icon: '✅' },
            { key: 'watch',     level: 1, icon: '👁️' },
            { key: 'alert',     level: 2, icon: '⚠️' },
            { key: 'severe',    level: 3, icon: '🚨' },
          ].map(({ key, level, icon }) => {
            const s = STRESS[level as keyof typeof STRESS]
            const count = summary[key as keyof typeof summary] as number
            const pct = Math.round((count / summary.total) * 100)
            return (
              <div key={key} style={{
                padding: '20px 24px', borderRight: level < 3 ? '1px solid var(--border)' : 'none',
                background: count > 0 && level > 0 ? s.bg : undefined,
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {icon} {s.label}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {pct}% of species
                </div>
                <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginTop: '8px' }}>
                  <div style={{ height: '3px', borderRadius: '2px', background: s.color, width: `${pct}%`, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div style={{
        padding: '16px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap',
        alignItems: 'center', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Risk level:</span>
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: '20px', border: '1px solid var(--border)',
            fontSize: '12px', fontWeight: filter === f ? 600 : 400, cursor: 'pointer',
            background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
            color: filter === f ? 'white' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>
            {f === 'all' ? 'All' : f === 'high' ? '🚨 High Risk' : f === 'medium' ? '⚠️ At Watch' : '✅ Safe'}
          </button>
        ))}
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Sensitivity:</span>
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button key={f} onClick={() => setSensFilter(f)} style={{
            padding: '5px 14px', borderRadius: '20px', border: '1px solid var(--border)',
            fontSize: '12px', fontWeight: sensFilter === f ? 600 : 400, cursor: 'pointer',
            background: sensFilter === f ? '#0f172a' : 'var(--bg-card)',
            color: sensFilter === f ? 'white' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>
            {f === 'all' ? 'All' : `${SENSITIVITY_ICON[f]} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {filtered.length} of {data?.species?.length ?? 0} species
        </span>
      </div>

      {/* Species grid */}
      <div style={{ padding: '24px' }}>
        {speciesQ.isLoading || forecastQ.isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: '160px', borderRadius: '14px', background: '#e5e7eb', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p>No species match the selected filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filtered.map((sp: any) => {
              const s = STRESS[sp.stress_level as keyof typeof STRESS]
              const barWidth = Math.min(sp.stress_score * 100, 100)
              return (
                <div key={sp.id} style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', fontStyle: 'italic', margin: 0 }}>{sp.name}</p>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>{sp.common} · {sp.family}</p>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                      borderRadius: '20px', background: s.badge, color: s.text,
                      border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
                    }}>
                      {sp.stress_label}
                    </span>
                  </div>

                  {/* Metrics grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: 'Bleach threshold', value: `${sp.bleach_threshold}°C` },
                      { label: 'Current SST', value: `${sp.current_sst}°C` },
                      { label: 'Above threshold', value: `+${sp.sst_above_threshold}°C`, highlight: sp.sst_above_threshold > 0 },
                      { label: 'Sensitivity', value: `${SENSITIVITY_ICON[sp.sensitivity as keyof typeof SENSITIVITY_ICON]} ${sp.sensitivity}` },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} style={{
                        background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '8px 10px',
                      }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: highlight ? s.color : '#1e293b' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Stress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Stress score</span>
                      <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: s.color, fontWeight: 700 }}>
                        {(sp.stress_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px' }}>
                      <div style={{
                        height: '5px', borderRadius: '3px', background: s.color,
                        width: `${barWidth}%`, transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📊 {sp.obis_records?.toLocaleString()} OBIS records</span>
                    <span>📏 {sp.depth}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}