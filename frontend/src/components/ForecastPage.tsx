'use client'
import { useQuery } from '@tanstack/react-query'
import { useReefStore } from '@/lib/store'
import { getForecast } from '@/lib/api'
import type { ForecastData, ForecastDay, RiskInfo } from '@/lib/api'
import ModelCard from './ModelCard'

// ── Loading skeleton ──────────────────────────────────────────────────────

function ForecastSkeleton() {
  return (
    <div>
      <div style={{ padding: '24px 28px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="skeleton" style={{ width: '220px', height: '24px', marginBottom: '8px' }}/>
        <div className="skeleton" style={{ width: '380px', height: '13px' }}/>
      </div>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
        <div className="skeleton" style={{ width: '120px', height: '16px', marginBottom: '16px' }}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="g-card" style={{ padding: '16px 12px' }}>
              <div className="skeleton" style={{ width: '48px', height: '10px', margin: '0 auto 6px' }}/>
              <div className="skeleton" style={{ width: '36px', height: '10px', margin: '0 auto 12px' }}/>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 12px' }}/>
              <div className="skeleton" style={{ width: '58px', height: '18px', margin: '0 auto 10px' }}/>
              <div className="skeleton" style={{ width: '44px', height: '10px', margin: '0 auto 4px' }}/>
              <div className="skeleton" style={{ width: '44px', height: '10px', margin: '0 auto 12px' }}/>
              <div className="skeleton" style={{ width: '100%', height: '22px', borderRadius: '20px' }}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '28px' }}>
        <div className="skeleton" style={{ width: '200px', height: '16px', marginBottom: '16px' }}/>
        <div className="skeleton" style={{ height: '220px', borderRadius: '16px' }}/>
      </div>
    </div>
  )
}

// ── Risk chip ─────────────────────────────────────────────────────────────

function RiskChip({ risk }: { risk: RiskInfo }) {
  const icons = ['✅', '👀', '⚠️', '🚨']
  const bgs   = ['var(--chip-bg)', '#fef3c7', '#fff7ed', '#fef2f2']
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap',
      background: bgs[risk.level] ?? bgs[0],
      color: risk.color,
      border: `1px solid ${risk.color}40`,
    }}>
      {icons[risk.level]} {risk.label}
    </span>
  )
}

// ── SST History + Forecast chart ──────────────────────────────────────────

function SSTForecastChart({ chartData, todayIdx }: {
  chartData: ForecastData['chart_data']
  todayIdx:  number
}) {
  const W = 720, H = 230
  const PAD = { top: 28, bottom: 40, left: 12, right: 76 }
  const cW  = W - PAD.left - PAD.right
  const cH  = H - PAD.top  - PAD.bottom

  const temps  = chartData.map(d => d.sst)
  const minT   = Math.min(...temps) - 0.8
  const maxT   = Math.max(Math.max(...temps) + 0.8, 30.0)

  const xi = (i: number) => PAD.left + (i / (chartData.length - 1)) * cW
  const yt  = (t: number) => PAD.top  + cH - ((t - minT) / (maxT - minT)) * cH

  const todayX = xi(todayIdx)
  const y28    = yt(28)
  const y29    = yt(29)
  const show28 = maxT >= 27.5
  const show29 = maxT >= 29.0

  const histPts = chartData.slice(0, todayIdx + 1).map((d, i) => `${xi(i)},${yt(d.sst)}`).join(' ')
  const fcstPts = chartData.slice(todayIdx).map((d, i) => `${xi(todayIdx + i)},${yt(d.sst)}`).join(' ')

  const histArea =
    `M${xi(0)},${yt(chartData[0].sst)} ` +
    chartData.slice(1, todayIdx + 1).map((d, i) => `L${xi(i + 1)},${yt(d.sst)}`).join(' ') +
    ` L${todayX},${PAD.top + cH} L${xi(0)},${PAD.top + cH} Z`

  const fcstArea =
    `M${todayX},${yt(chartData[todayIdx].sst)} ` +
    chartData.slice(todayIdx + 1).map((d, i) => `L${xi(todayIdx + i + 1)},${yt(d.sst)}`).join(' ') +
    ` L${xi(chartData.length - 1)},${PAD.top + cH} L${todayX},${PAD.top + cH} Z`

  const safetyGap = parseFloat((28 - chartData[todayIdx].sst).toFixed(1))
  const midY      = (yt(chartData[todayIdx].sst) + (show28 ? y28 : PAD.top + 20)) / 2

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="fhg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0284c7" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02"/>
        </linearGradient>
        <linearGradient id="ffg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0284c7" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01"/>
        </linearGradient>
      </defs>

      {show28 && show29 && <rect x={PAD.left} y={y29} width={cW} height={y28 - y29} fill="rgba(239,68,68,0.05)"/>}

      {show29 && (
        <>
          <line x1={PAD.left} y1={y29} x2={W - PAD.right} y2={y29} stroke="#f97316" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.75"/>
          <text x={W - PAD.right + 5} y={y29 + 4} fontSize="9.5" fill="#f97316" fontWeight="700">29°C ⚠️</text>
        </>
      )}
      {show28 && (
        <>
          <line x1={PAD.left} y1={y28} x2={W - PAD.right} y2={y28} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.75"/>
          <text x={W - PAD.right + 5} y={y28 + 4} fontSize="9.5" fill="#ef4444" fontWeight="700">28°C 🔴</text>
          <text x={W - PAD.right + 5} y={y28 + 16} fontSize="8" fill="#ef4444" opacity="0.7">bleach</text>
        </>
      )}

      <path d={histArea} fill="url(#fhg)"/>
      <path d={fcstArea} fill="url(#ffg)"/>

      <polyline points={histPts} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={fcstPts} fill="none" stroke="#0284c7" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 4" opacity="0.7"/>

      <line x1={todayX} y1={PAD.top} x2={todayX} y2={PAD.top + cH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
      <rect x={todayX - 20} y={PAD.top - 18} width="40" height="15" rx="4" fill="#0284c7"/>
      <text x={todayX} y={PAD.top - 7} fontSize="8" fill="white" textAnchor="middle" fontWeight="700">TODAY</text>
      <text x={todayX + 14} y={PAD.top + 14} fontSize="9" fill="#94a3b8" fontStyle="italic">forecast →</text>

      {show28 && safetyGap > 1.5 && (
        <>
          <line x1={todayX - 28} y1={yt(chartData[todayIdx].sst)} x2={todayX - 28} y2={y28} stroke="#22c55e" strokeWidth="1" strokeDasharray="3 2" opacity="0.7"/>
          <text x={todayX - 24} y={midY + 4}  fontSize="9" fill="#22c55e" fontWeight="700">+{safetyGap}°C</text>
          <text x={todayX - 24} y={midY + 16} fontSize="8" fill="#22c55e" opacity="0.8">margin</text>
        </>
      )}

      {chartData.map((d, i) => (
        <circle key={i}
          cx={xi(i)} cy={yt(d.sst)}
          r={i === todayIdx ? 5.5 : 3}
          fill={i === todayIdx ? '#0284c7' : i < todayIdx ? '#bae6fd' : 'white'}
          stroke={i >= todayIdx ? '#0284c7' : 'none'}
          strokeWidth="1.5"
          opacity={i > todayIdx ? 0.75 : 1}
        />
      ))}

      {chartData.map((d, i) => (
        i % 2 === 0 ? (
          <text key={i} x={xi(i)} y={H - 5} fontSize="8.5"
            fill={i === todayIdx ? '#0284c7' : '#94a3b8'}
            textAnchor="middle" fontWeight={i === todayIdx ? '700' : '400'}>
            {d.label}
          </text>
        ) : null
      ))}
    </svg>
  )
}

// ── DHW projection bar chart ──────────────────────────────────────────────

function DHWChart({ dhwData }: { dhwData: number[] }) {
  const W = 320, H = 130
  const PAD = { top: 20, bottom: 28, left: 10, right: 44 }
  const cW  = W - PAD.left - PAD.right
  const cH  = H - PAD.top  - PAD.bottom
  const MAX = Math.max(10, Math.max(...dhwData) * 2, 8)
  const bW  = (cW / 7) - 4
  const bx  = (i: number) => PAD.left + (i / 7) * cW + 2
  const barH = (v: number) => Math.max(3, (v / MAX) * cH)
  const barY = (v: number) => PAD.top + cH - barH(v)
  const t4Y  = PAD.top + cH - (4 / MAX) * cH
  const t8Y  = PAD.top + cH - (8 / MAX) * cH
  const DAYS = ['T', 'W', 'Th', 'F', 'Sa', 'Su', 'M']

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {MAX >= 8 && (
        <>
          <line x1={PAD.left} y1={t8Y} x2={W - PAD.right} y2={t8Y} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"/>
          <text x={W - PAD.right + 4} y={t8Y + 4} fontSize="8" fill="#ef4444">8.0</text>
        </>
      )}
      <line x1={PAD.left} y1={t4Y} x2={W - PAD.right} y2={t4Y} stroke="#f97316" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.75"/>
      <text x={W - PAD.right + 4} y={t4Y + 4}  fontSize="9" fill="#f97316" fontWeight="700">4.0</text>
      <text x={W - PAD.right + 4} y={t4Y + 16} fontSize="8" fill="#f97316" opacity="0.7">risk</text>

      {dhwData.slice(0, 7).map((v, i) => (
        <rect key={i}
          x={bx(i)} y={barY(v)} width={bW} height={barH(v)} rx="2"
          fill={v > 8 ? '#ef4444' : v > 4 ? '#f97316' : '#0284c7'} opacity="0.75"
        />
      ))}
      {dhwData.slice(0, 7).map((v, i) => (
        <text key={i} x={bx(i) + bW / 2} y={barY(v) - 3} fontSize="8" fill="#94a3b8" textAnchor="middle">
          {v.toFixed(1)}
        </text>
      ))}
      {DAYS.map((d, i) => (
        <text key={i} x={bx(i) + bW / 2} y={H - 4} fontSize="8.5" fill="#94a3b8" textAnchor="middle">{d}</text>
      ))}
    </svg>
  )
}

// ── Seasonal context ──────────────────────────────────────────────────────

const SEASONS = [
  { months: 'Jun – Sep', label: 'Winter Safety', icon: '✅', color: '#0284c7', desc: 'SSTs 22–24 °C. DHW halts — primary reef recovery window.' },
  { months: 'Oct – Nov', label: 'Watch Period',  icon: '👀', color: '#f59e0b', desc: 'SSTs rise past 25 °C. Begin monitoring DHW closely.' },
  { months: 'Dec – Apr', label: 'Risk Season',   icon: '⚠️', color: '#ef4444', desc: 'Peak SSTs 27–30 °C. All five GBR mass bleaching events occurred here.' },
  { months: 'May',       label: 'Transition',    icon: '🔄', color: '#8b5cf6', desc: 'Cooling begins. Recovery if no sustained bleaching occurred.' },
]

// ── Main page ─────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const { selectedLocation } = useReefStore()
  const { lat, lon } = selectedLocation

  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['forecast', lat, lon],
    queryFn:  () => getForecast(lat, lon),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  if (isLoading) return <ForecastSkeleton />

  if (isError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
      <div style={{ fontSize: '40px' }}>⚠️</div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Forecast unavailable</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Make sure the FastAPI backend is running on port 8000.</p>
    </div>
  )

  if (!data) return null

  const dhwData = data.days.map(d => d.dhw)
  const updatedTime = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null

  const outlookStyles: Record<string, { bg: string; color: string; border: string }> = {
    safe:  { bg: '#ecfeff', color: '#0369a1', border: '#a5f3fc' },
    watch: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    alert: { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  }
  const oc = outlookStyles[data.outlook.level] ?? outlookStyles.safe

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Banner ── */}
      <div style={{
        padding: '24px 28px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '22px' }}>🔮</span>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>7-Day Reef Forecast</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Station ({lat}, {lon}) · NOAA CRW satellite SST + Open-Meteo marine NWP
            {updatedTime && ` · Fetched ${updatedTime}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 16px', borderRadius: '20px', background: oc.bg, color: oc.color, border: `1px solid ${oc.border}` }}>
            {data.outlook.level === 'safe' ? '✅' : data.outlook.level === 'watch' ? '👀' : '⚠️'} {data.outlook.label}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-subtle)', textAlign: 'right' }}>
            <div>SST: <span className="mono" style={{ color: 'var(--accent)' }}>{data.current.sst}°C</span></div>
            <div>DHW: <span className="mono" style={{ color: 'var(--accent)' }}>{data.current.dhw} °C-wk</span></div>
          </div>
        </div>
      </div>

      {/* ── 7-day strip ── */}
      <section style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px' }}>📅</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Outlook</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {data.days.map((d, i) => (
            <div key={i} className="g-card" style={{
              padding: '16px 12px', textAlign: 'center',
              background: i === 0
                ? 'linear-gradient(var(--accent-bg), var(--accent-bg)) padding-box, linear-gradient(135deg, rgba(56,189,248,.55), rgba(129,140,248,.4)) border-box'
                : undefined,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{d.short}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '10px' }}>{d.date}</div>
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>{d.icon}</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{d.sst}°C</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>〰️ {d.wave}m</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>💨 {d.wind}km/h {d.dir}</div>
              <RiskChip risk={d.risk} />
              <div style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '5px' }}>
                {(d.risk.probability * 100).toFixed(0)}% risk
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SST Chart ── */}
      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '16px' }}>📈</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>SST History &amp; Forecast</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Solid = NOAA CRW observed · Dashed = model projection · Thresholds at 28 °C / 29 °C
        </p>
        <div className="g-card" style={{ padding: '20px 16px' }}>
          <SSTForecastChart chartData={data.chart_data} todayIdx={data.today_idx} />
        </div>
      </section>

      {/* ── DHW + Risk table ── */}
      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <span style={{ fontSize: '16px' }}>☀️</span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>DHW 7-Day Projection</h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Physical accumulation model · Orange = Watch (4 °C-wk) · Red = Alert (8 °C-wk)
          </p>
          <div className="g-card" style={{ padding: '16px' }}>
            <DHWChart dhwData={dhwData} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <span style={{ fontSize: '16px' }}>{Math.max(...dhwData) > 4 ? '⚠️' : '✅'}</span>
              <p style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, margin: 0 }}>
                {Math.max(...dhwData) > 4
                  ? `Peak DHW ${Math.max(...dhwData).toFixed(1)} °C-wk — bleaching watch threshold exceeded.`
                  : `Max DHW ${Math.max(...dhwData).toFixed(1)} °C-wk — below bleaching threshold.`}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <span style={{ fontSize: '16px' }}>📋</span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Risk Summary</h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Bleaching probability from Logistic Regression · features: SST, DHW, month.
          </p>
          {data.days.map((d, i) => (
            <div key={i} className="g-card" style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', marginBottom: '8px',
              background: i === 0
                ? 'linear-gradient(var(--accent-bg), var(--accent-bg)) padding-box, linear-gradient(135deg, rgba(56,189,248,.55), rgba(129,140,248,.4)) border-box'
                : undefined,
            }}>
              <span style={{ fontSize: '18px', width: '26px', textAlign: 'center' }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.short} · {d.date}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  SST <span className="mono">{d.sst}°C</span> · DHW <span className="mono">{d.dhw}</span> · {d.wave}m · {d.wind}km/h
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <RiskChip risk={d.risk} />
                <div style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '3px' }}>
                  {(d.risk.probability * 100).toFixed(1)}% probability
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Seasonal context ── */}
      <section style={{ padding: '28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontSize: '16px' }}>🌿</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Seasonal Context</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          GBR bleaching follows a predictable southern-hemisphere seasonal cycle.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
          {SEASONS.map(s => (
            <div key={s.months} className="g-card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{s.months}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{s.label}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Data sources */}
        <div className="g-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '18px', marginTop: '1px' }}>ℹ️</span>
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', lineHeight: 1.75 }}>
            {Object.entries(data.data_sources).map(([k, v]) => (
              <div key={k}><strong style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</strong> {v}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ML Model Card ── */}
      <ModelCard />

    </div>
  )
}