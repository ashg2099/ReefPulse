'use client'
import { useQuery } from '@tanstack/react-query'
import { useReefStore } from '@/lib/store'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AlertsPage() {
  const { lat, lon } = useReefStore()
  const [notifState, setNotifState] = useState({
    watch: true, alert: true, severe: true, weekly: false,
  })

  const alertsQ = useQuery({
    queryKey: ['alerts', lat, lon],
    queryFn: () => fetch(`${API}/alerts?lat=${lat}&lon=${lon}`).then(r => r.json()),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const data = alertsQ.data
  const current = data?.current_alert

  const heroBg =
    current?.level === 3 ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' :
    current?.level === 2 ? 'linear-gradient(135deg, #7c2d12, #9a3412)' :
    current?.level === 1 ? 'linear-gradient(135deg, #78350f, #92400e)' :
    'linear-gradient(135deg, #14532d, #15803d)'

  const heroIcon =
    current?.level === 3 ? '🚨' :
    current?.level === 2 ? '⚠️' :
    current?.level === 1 ? '👁️' : '✅'

  if (alertsQ.isLoading) return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ height: '80px', borderRadius: '12px', background: '#e5e7eb' }} />
      ))}
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>

      {/* Hero banner */}
      <div style={{ background: heroBg, padding: '40px 32px 32px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '40px', lineHeight: 1 }}>{heroIcon}</span>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px' }}>
              {current?.name ?? '—'}
            </h1>
            <p style={{ fontSize: '14px', opacity: 0.85, margin: 0, lineHeight: 1.6, maxWidth: '600px' }}>
              {current?.description}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Sea Surface Temp', value: current?.sst != null ? `${current.sst}°C` : '—' },
            { label: 'Degree Heating Weeks', value: current?.dhw != null ? `${current.dhw} °C-wks` : '—' },
            { label: 'Last Updated', value: current?.generated_at ? new Date(current.generated_at).toLocaleTimeString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '10px', padding: '8px 16px',
            }}>
              <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Station monitoring */}
        <section>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            🗺️ Station Monitoring
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Live thermal stress status across 6 GBR monitoring stations
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {data?.stations?.map((st: any) => (
              <div key={st.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '18px',
                borderLeft: `4px solid ${st.alert_color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{st.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
                      {Math.abs(st.lat)}°S · {st.lon}°E
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                    background: st.alert_color + '20', color: st.alert_color,
                    border: `1px solid ${st.alert_color}40`,
                  }}>
                    {st.alert_name}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'SST', value: `${st.sst}°C` },
                    { label: 'DHW', value: `${st.dhw} °C-wks` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: 'var(--bg-section)', borderRadius: '8px', padding: '8px 12px',
                    }}>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', margin: '2px 0 0' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alert threshold guide */}
        <section>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            📊 Alert Level Guide
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Based on NOAA Coral Reef Watch DHW thresholds
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {data?.thresholds?.map((t: any) => (
              <div key={t.level} style={{
                background: 'var(--bg-card)', borderRadius: '12px', padding: '16px',
                border: `1px solid ${t.color}30`,
                borderTop: `3px solid ${t.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.color }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{t.name}</span>
                  <span style={{
                    fontSize: '10px', color: t.color, marginLeft: 'auto',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                  }}>
                    DHW {t.dhw_min}–{t.dhw_max === 999 ? '∞' : t.dhw_max}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Notification preferences */}
        <section>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            🔔 Alert Preferences
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Configure which events trigger notifications
          </p>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            {[
              { key: 'watch',  label: 'Bleaching Watch (DHW ≥ 1)',  desc: 'Early warning when thermal stress begins accumulating',               color: '#ca8a04' },
              { key: 'alert',  label: 'Bleaching Alert (DHW ≥ 4)',  desc: 'Significant bleaching likely for sensitive species',                  color: '#ea580c' },
              { key: 'severe', label: 'Severe Alert (DHW ≥ 8)',     desc: 'Mass bleaching event — immediate attention required',                 color: '#dc2626' },
              { key: 'weekly', label: 'Weekly Summary',              desc: 'Weekly SST and DHW digest for all 6 GBR monitoring stations',        color: '#0284c7' },
            ].map(({ key, label, desc, color }, i, arr) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', gap: '16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{desc}</p>
                  </div>
                </div>
                <div
                  onClick={() => setNotifState(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                    background: notifState[key as keyof typeof notifState] ? color : '#d1d5db',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px',
                    left: notifState[key as keyof typeof notifState] ? '23px' : '3px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}