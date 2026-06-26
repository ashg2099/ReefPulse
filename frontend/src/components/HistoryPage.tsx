'use client'
import { useQuery } from '@tanstack/react-query'
import { useReefStore } from '@/lib/store'
import { getHistory } from '@/lib/api'
import type { HistoryData, MonthlySST, DailySST, BleachingEvent } from '@/lib/api'

// ── Loading skeleton ──────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div style={{ padding: '28px' }}>
      <div className="skeleton" style={{ width: '260px', height: '24px', marginBottom: '8px' }}/>
      <div className="skeleton" style={{ width: '380px', height: '13px', marginBottom: '32px' }}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '32px' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton g-card" style={{ height: '90px' }}/>)}
      </div>
      <div className="skeleton" style={{ height: '240px', borderRadius: '16px', marginBottom: '32px' }}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }}/>)}
      </div>
    </div>
  )
}

// ── Anomaly colour helper ────────────────────────────────────────────────────

function anomColor(anom: number): string {
  if (anom >  1.5) return '#ef4444'
  if (anom >  0.5) return '#f97316'
  if (anom >  0.0) return '#f59e0b'
  if (anom > -0.5) return '#0284c7'
  return '#06b6d4'
}

// ── Monthly SST bar chart ────────────────────────────────────────────────────

function MonthlyChart({ monthly }: { monthly: MonthlySST[] }) {
  if (!monthly.length) return null

  const W = 760, H = 200
  const PAD = { top: 24, bottom: 40, left: 12, right: 12 }
  const cW  = W - PAD.left - PAD.right
  const cH  = H - PAD.top  - PAD.bottom

  const allTemps = monthly.flatMap(m => [m.mean, m.clim])
  const minT = Math.min(...allTemps) - 1
  const maxT = Math.max(...allTemps) + 1
  const yt   = (t: number) => PAD.top + cH - ((t - minT) / (maxT - minT)) * cH
  const bW   = cW / monthly.length
  const bx   = (i: number) => PAD.left + i * bW

  const climPts = monthly
    .map((m, i) => `${bx(i) + bW / 2},${yt(m.clim)}`)
    .join(' ')

  const gridTemps = [24, 26, 28, 30].filter(t => t >= minT && t <= maxT)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {gridTemps.map(t => (
        <g key={t}>
          <line x1={PAD.left} y1={yt(t)} x2={W - PAD.right} y2={yt(t)} stroke="var(--border)" strokeWidth="0.5"/>
          <text x={W - PAD.right + 3} y={yt(t) + 4} fontSize="8" fill="var(--text-subtle)">{t}°</text>
        </g>
      ))}

      {monthly.map((m, i) => (
        <g key={i}>
          <rect
            x={bx(i) + 2} y={yt(m.mean)}
            width={bW - 4} height={Math.max(2, (PAD.top + cH) - yt(m.mean))}
            rx="2" fill={anomColor(m.anom)} opacity="0.75"
          />
          {i % 3 === 0 && (
            <text x={bx(i) + bW / 2} y={H - 5} fontSize="8" fill="var(--text-subtle)" textAnchor="middle">
              {m.label}
            </text>
          )}
        </g>
      ))}

      <polyline points={climPts} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6"/>

      <rect x={PAD.left} y={PAD.top - 16} width="90" height="13" rx="3" fill="rgba(0,0,0,0.3)"/>
      <text x={PAD.left + 6} y={PAD.top - 6} fontSize="8" fill="white">— 30-yr climatology</text>
    </svg>
  )
}

// ── 90-day daily anomaly sparkline ───────────────────────────────────────────

function DailyAnomalyChart({ daily }: { daily: DailySST[] }) {
  if (!daily.length) return null

  const W = 760, H = 120
  const PAD = { top: 16, bottom: 24, left: 12, right: 12 }
  const cW  = W - PAD.left - PAD.right
  const cH  = H - PAD.top  - PAD.bottom

  const anoms  = daily.map(d => d.anom)
  const maxAbs = Math.max(Math.abs(Math.min(...anoms)), Math.abs(Math.max(...anoms)), 1.5)
  const yz     = PAD.top + cH / 2
  const ya     = (a: number) => yz - (a / maxAbs) * (cH / 2)
  const xi     = (i: number) => PAD.left + (i / (daily.length - 1)) * cW

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD.left} y1={yz} x2={W - PAD.right} y2={yz} stroke="var(--border)" strokeWidth="1"/>
      <text x={PAD.left} y={yz - 3} fontSize="8" fill="var(--text-subtle)">+0°C</text>
      <text x={PAD.left} y={ya(1.0) + 3} fontSize="8" fill="#f59e0b">+1°C</text>
      <line x1={PAD.left} y1={ya(1.0)} x2={W - PAD.right} y2={ya(1.0)} stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.5"/>

      {daily.map((d, i) => {
        const x  = xi(i)
        const y0 = yz
        const y1 = ya(d.anom)
        return (
          <line key={i} x1={x} y1={y0} x2={x} y2={y1}
            stroke={anomColor(d.anom)} strokeWidth="1.5" opacity="0.8"/>
        )
      })}

      {[0, Math.floor(daily.length / 2), daily.length - 1].map(i => (
        daily[i] ? (
          <text key={i} x={xi(i)} y={H - 2} fontSize="8" fill="var(--text-subtle)" textAnchor="middle">
            {daily[i].date.slice(5)}
          </text>
        ) : null
      ))}
    </svg>
  )
}

// ── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ level, label }: { level: number; label: string }) {
  const configs = [
    {},
    { bg: '#fef3c7', color: '#92400e', icon: '🟡' },
    { bg: '#fff7ed', color: '#9a3412', icon: '🟠' },
    { bg: '#fef2f2', color: '#7f1d1d', icon: '🔴' },
    { bg: '#fef2f2', color: '#450a0a', icon: '🆘' },
  ]
  const c = configs[level] ?? configs[2]
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: c.bg, color: c.color }}>
      {c.icon} {label}
    </span>
  )
}

// ── Bleaching event card ──────────────────────────────────────────────────────

function EventCard({ ev }: { ev: BleachingEvent }) {
  return (
    <div className="g-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
        <div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: ev.color, lineHeight: 1 }}>{ev.year}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>{ev.name}</div>
        </div>
        <SeverityBadge level={ev.severity} label={ev.severity_label} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {[
          { label: '% bleached', value: `${ev.pct_bleached}%`,   color: ev.color },
          { label: '% mortality', value: `${ev.pct_mortality}%`, color: ev.pct_mortality > 20 ? '#ef4444' : '#f97316' },
          { label: 'Peak DHW',    value: `${ev.dhw_peak}`,       color: ev.dhw_peak > 8 ? '#ef4444' : '#f97316' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: '8px', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
            <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '8px' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Cause:</strong> {ev.cause}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '10px' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Recovery:</strong> {ev.recovery}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
        📖 {ev.citation}
      </div>
    </div>
  )
}

// ── Summary stat chip ─────────────────────────────────────────────────────────

function StatChip({ icon, label, value, sub, good }: {
  icon: string; label: string; value: string; sub?: string; good: boolean
}) {
  return (
    <div className="g-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div>
        <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: good ? '#22c55e' : '#ef4444' }}>{value}</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { selectedLocation } = useReefStore()
  const { lat, lon } = selectedLocation

  const { data, isLoading, isError } = useQuery<HistoryData>({
    queryKey: ['history', lat, lon],
    queryFn:  () => getHistory(lat, lon),
    staleTime: 10 * 60_000,
    retry: 1,
  })

  if (isLoading) return <HistorySkeleton />

  if (isError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
      <div style={{ fontSize: '40px' }}>📡</div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>History unavailable</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Check that the FastAPI backend is running and NOAA ERDDAP is reachable.</p>
    </div>
  )

  if (!data) return null

  const { summary, monthly, daily, bleaching_events } = data
  const meanAnom = summary.mean_anomaly ?? 0

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Banner ── */}
      <div style={{ padding: '24px 28px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px' }}>📊</span>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>Historical Record</h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Station ({lat}, {lon}) · {summary.days_fetched} days of {summary.data_source} · GBR bleaching event archive
        </p>
      </div>

      {/* ── Summary chips ── */}
      <section style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <StatChip
            icon="🌡️" label="Peak SST (12 months)"
            value={summary.peak_sst ? `${summary.peak_sst}°C` : '—'}
            sub="satellite observed"
            good={!summary.peak_sst || summary.peak_sst < 29}
          />
          <StatChip
            icon="📈" label="Mean SST Anomaly"
            value={meanAnom !== null ? `${meanAnom > 0 ? '+' : ''}${meanAnom.toFixed(2)}°C` : '—'}
            sub="vs 30-yr climatology"
            good={meanAnom < 0.5}
          />
          <StatChip
            icon="🔥" label="Warm Days"
            value={String(summary.warm_days)}
            sub=">1°C above climatology"
            good={summary.warm_days < 30}
          />
          <StatChip
            icon="🦺" label="Bleaching Events"
            value="6"
            sub="on GBR record since 1998"
            good={false}
          />
        </div>
      </section>

      {/* ── Monthly SST chart ── */}
      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '16px' }}>📅</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Mean SST — Last 12 Months</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Bars = observed monthly mean · Dashed white line = 30-yr climatological mean · Colour = temperature anomaly
        </p>
        <div className="g-card" style={{ padding: '20px 16px' }}>
          <MonthlyChart monthly={monthly} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { color: '#06b6d4', label: 'Below normal (< −0.5°C)' },
              { color: '#f59e0b', label: 'Slightly warm (+0–1°C)' },
              { color: '#f97316', label: 'Warm (+1–1.5°C)' },
              { color: '#ef4444', label: 'Hot (> +1.5°C)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }}/>
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daily anomaly chart ── */}
      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '16px' }}>📉</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Daily SST Anomaly — Last 90 Days</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Each bar = one day. Height = deviation above/below the 30-yr climatological mean for that month.
        </p>
        <div className="g-card" style={{ padding: '20px 16px' }}>
          <DailyAnomalyChart daily={daily} />
        </div>
      </section>

      {/* ── Bleaching events ── */}
      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '16px' }}>🪸</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>GBR Mass Bleaching Events</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          All six confirmed mass bleaching events since modern satellite monitoring began. Data from AIMS LTMP, GBRMPA, and peer-reviewed literature.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {bleaching_events.map(ev => <EventCard key={ev.year} ev={ev} />)}
        </div>

        {/* Trend callout */}
        <div style={{ marginTop: '20px', padding: '16px 20px', borderRadius: '14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>Accelerating frequency</div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                The inter-event gap is shrinking: 4 years (1998→2002), 14 years (2002→2016), 1 year (2016→2017), 3 years (2017→2020), 2 years (2020→2022).
                In 2022, mass bleaching occurred for the first time during a La Niña year — indicating the SST baseline has shifted
                enough that even cooler ENSO conditions now exceed historical bleaching thresholds.
                Recovery windows between events are no longer sufficient for full coral regrowth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{ padding: '16px 28px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          '📡 NOAA CRW CoralTemp 5km',
          '🔬 AIMS Long-Term Monitoring Programme',
          '📖 Hughes et al. 2017 Nature · 2018 Science',
          '🏛️ Great Barrier Reef Marine Park Authority',
        ].map(s => <span key={s} style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{s}</span>)}
      </div>
    </div>
  )
}