'use client'
import { useQuery } from '@tanstack/react-query'
import { useReefStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const STATIONS = [
  { id: 'central_gbr',   name: 'Central GBR',  lat: -18.0, lon: 147.0 },
  { id: 'cairns',        name: 'Cairns',        lat: -16.9, lon: 145.8 },
  { id: 'cooktown',      name: 'Cooktown',      lat: -15.5, lon: 145.3 },
  { id: 'whitsundays',   name: 'Whitsundays',   lat: -20.2, lon: 148.9 },
  { id: 'capricorn',     name: 'Capricorn',     lat: -23.5, lon: 151.9 },
  { id: 'torres_strait', name: 'Torres Strait', lat: -10.6, lon: 142.2 },
]

type Status = 'healthy' | 'watch' | 'alert' | 'severe' | 'loading'

const LEVEL_TO_STATUS: Record<number, Status> = {
  0: 'healthy',
  1: 'watch',
  2: 'alert',
  3: 'severe',
}

const STATUS_STYLE: Record<Status, { color: string; glow: string; label: string }> = {
  healthy: { color: '#22c55e', glow: '#22c55e30', label: 'No Stress' },
  watch:   { color: '#f59e0b', glow: '#f59e0b30', label: 'Watch'     },
  alert:   { color: '#ef4444', glow: '#ef444430', label: 'Alert'     },
  severe:  { color: '#a855f7', glow: '#a855f730', label: 'Severe'    },
  loading: { color: '#475569', glow: '#47556930', label: '...'       },
}

const LAT_MIN = -24.5, LAT_MAX = -10.0
const LON_MIN = 141.5, LON_MAX = 153.5

function toSVG(lat: number, lon: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 480 + 10
  const y = ((lat - LAT_MAX) / (LAT_MIN - LAT_MAX)) * 300 + 10
  return { x, y }
}

export default function ReefMap() {
  const { lat, lon, setSelectedLocation } = useReefStore()

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts-map'],
    queryFn: async () => {
      const r = await fetch(`${API}/alerts`)
      if (!r.ok) throw new Error('alerts fetch failed')
      return r.json()
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const levelById: Record<string, number> = {}
  if (alertsData?.stations) {
    for (const s of alertsData.stations) {
      levelById[s.id] = s.alert_level ?? 0
    }
  }

  const getStatus = (id: string): Status => {
    if (isLoading) return 'loading'
    const level = levelById[id]
    return level !== undefined ? (LEVEL_TO_STATUS[level] ?? 'healthy') : 'healthy'
  }

  const isSelected = (s: typeof STATIONS[0]) =>
    Math.abs(lat - s.lat) < 0.15 && Math.abs(lon - s.lon) < 0.15

  return (
    <div style={{ width: '100%', fontFamily: 'inherit' }}>
      <div style={{
        fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
      }}>
        🛰 Reef Network
      </div>

      <div style={{
        width: '100%', borderRadius: '14px', overflow: 'hidden',
        border: '1px solid rgba(148,163,184,0.15)',
        background: 'linear-gradient(160deg, #0c1e35 0%, #0a2540 50%, #0d2137 100%)',
      }}>
        <svg width="100%" viewBox="0 0 500 320" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="rm-oceanGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#1e4d7b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0a2540" stopOpacity="0" />
            </radialGradient>
            <pattern id="rm-grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.07)" strokeWidth="0.5"/>
            </pattern>
            <filter id="rm-glow-sm">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="rm-glow-md">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <rect width="500" height="320" fill="url(#rm-oceanGrad)" />
          <rect width="500" height="320" fill="url(#rm-grid)" />

          {[-12, -15, -18, -21, -24].map(latLine => {
            const y = ((latLine - LAT_MAX) / (LAT_MIN - LAT_MAX)) * 300 + 10
            return (
              <g key={latLine}>
                <line x1="32" y1={y} x2="500" y2={y}
                  stroke="rgba(148,163,184,0.10)" strokeWidth="0.5" strokeDasharray="4,4"/>
                <text x="28" y={y + 3} fontSize="7.5" fill="rgba(148,163,184,0.35)" textAnchor="end">
                  {Math.abs(latLine)}°S
                </text>
              </g>
            )
          })}

          {[142, 144, 146, 148, 150, 152].map(lonLine => {
            const x = ((lonLine - LON_MIN) / (LON_MAX - LON_MIN)) * 480 + 10
            return (
              <g key={lonLine}>
                <line x1={x} y1="0" x2={x} y2="296"
                  stroke="rgba(148,163,184,0.10)" strokeWidth="0.5" strokeDasharray="4,4"/>
                <text x={x} y="308" fontSize="7.5" fill="rgba(148,163,184,0.35)" textAnchor="middle">
                  {lonLine}°E
                </text>
              </g>
            )
          })}

          {/* GBR reef zone */}
          <path
            d="M 148 14 Q 172 18 198 36 Q 224 58 238 88 Q 250 118 248 148 Q 244 178 228 200 Q 208 224 184 232 Q 160 238 138 226 Q 114 212 100 188 Q 84 162 84 134 Q 84 104 98 80 Q 114 54 134 34 Z"
            fill="rgba(6,182,212,0.05)"
            stroke="rgba(6,182,212,0.2)"
            strokeWidth="1"
            strokeDasharray="6,3"
          />
          <text x="172" y="126" fontSize="7.5" fill="rgba(6,182,212,0.35)" textAnchor="middle" fontWeight="500">GREAT BARRIER</text>
          <text x="172" y="136" fontSize="7.5" fill="rgba(6,182,212,0.35)" textAnchor="middle" fontWeight="500">REEF ZONE</text>

          {/* Australia coastline */}
          <path
            d="M 30 58 Q 46 52 68 66 Q 88 80 92 108 Q 96 138 84 162 Q 70 186 56 198 Q 40 210 28 204"
            fill="rgba(71,85,105,0.12)"
            stroke="rgba(148,163,184,0.18)"
            strokeWidth="1"
          />
          <text x="50" y="136" fontSize="7" fill="rgba(148,163,184,0.2)" textAnchor="middle" transform="rotate(-6,50,136)">
            AUSTRALIA
          </text>

          <text x="390" y="170" fontSize="9" fill="rgba(148,163,184,0.18)" textAnchor="middle" fontStyle="italic">
            Coral Sea
          </text>

          {/* Station markers */}
          {STATIONS.map(s => {
            const { x, y } = toSVG(s.lat, s.lon)
            const sel = isSelected(s)
            const status = getStatus(s.id)
            const st = STATUS_STYLE[status]

            return (
              <g key={s.id} onClick={() => setSelectedLocation({ lat: s.lat, lon: s.lon })} style={{ cursor: 'pointer' }}>
                {/* Ambient glow */}
                <circle cx={x} cy={y} r="9" fill={st.glow}/>

                {/* Selected pulse */}
                {sel && (
                  <>
                    <circle cx={x} cy={y} r="14" fill="none" stroke={st.color} strokeWidth="1" opacity="0">
                      <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx={x} cy={y} r="10" fill={st.glow} stroke={st.color} strokeWidth="0.8" opacity="0.5"/>
                  </>
                )}

                {/* Alert/severe pulse when not selected */}
                {!sel && (status === 'alert' || status === 'severe') && (
                  <circle cx={x} cy={y} r="7" fill="none" stroke={st.color} strokeWidth="0.8" opacity="0">
                    <animate attributeName="r" values="5;12;5" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Main dot */}
                <circle
                  cx={x} cy={y}
                  r={sel ? 5.5 : 4}
                  fill={st.color}
                  opacity={isLoading ? 0.4 : sel ? 1 : 0.85}
                  filter={sel ? 'url(#rm-glow-md)' : 'url(#rm-glow-sm)'}
                />
                <circle cx={x} cy={y} r={sel ? 2.2 : 1.5} fill="white" opacity="0.9"/>

                {/* Label */}
                <rect
                  x={x + 8} y={y - 10}
                  width={s.name.length * 5.0 + 8} height="13"
                  rx="3"
                  fill="rgba(10,22,40,0.78)"
                  stroke={sel ? st.color + '80' : 'rgba(148,163,184,0.12)'}
                  strokeWidth={sel ? '0.8' : '0.4'}
                />
                <text x={x + 12} y={y - 0.5} fontSize="7"
                  fill={sel ? st.color : 'rgba(226,232,240,0.8)'}
                  fontWeight={sel ? '600' : '400'}
                >
                  {s.name}
                </text>
              </g>
            )
          })}

          {/* Compass */}
          <g transform="translate(466,28)">
            <circle cx="0" cy="0" r="11" fill="rgba(10,22,40,0.65)" stroke="rgba(148,163,184,0.18)" strokeWidth="0.5"/>
            <text x="0" y="-3" fontSize="6.5" fill="rgba(226,232,240,0.65)" textAnchor="middle" fontWeight="600">N</text>
            <path d="M0,-1.5 L1.8,3 L0,1.5 L-1.8,3 Z" fill="rgba(226,232,240,0.55)"/>
          </g>

          {/* Scale bar */}
          <g transform="translate(35,295)">
            <line x1="0" y1="0" x2="56" y2="0" stroke="rgba(148,163,184,0.35)" strokeWidth="1"/>
            <line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(148,163,184,0.35)" strokeWidth="1"/>
            <line x1="56" y1="-3" x2="56" y2="3" stroke="rgba(148,163,184,0.35)" strokeWidth="1"/>
            <text x="28" y="-5" fontSize="7" fill="rgba(148,163,184,0.35)" textAnchor="middle">~280 km</text>
          </g>
        </svg>
      </div>

      {/* Station selector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginTop: '8px' }}>
        {STATIONS.map(s => {
          const sel = isSelected(s)
          const status = getStatus(s.id)
          const st = STATUS_STYLE[status]
          return (
            <div
              key={s.id}
              onClick={() => setSelectedLocation({ lat: s.lat, lon: s.lon })}
              style={{
                padding: '7px 9px', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${sel ? st.color + '55' : 'var(--border)'}`,
                background: sel ? st.color + '10' : 'var(--bg-card)',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}
            >
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: isLoading ? 'var(--text-muted)' : st.color,
                boxShadow: sel && !isLoading ? `0 0 5px ${st.color}` : 'none',
                opacity: isLoading ? 0.4 : 1,
                transition: 'background 0.3s',
              }}/>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: '10.5px', fontWeight: sel ? 700 : 500,
                  color: 'var(--text-primary)', margin: 0, lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {s.name}
                </p>
                <p style={{
                  fontSize: '9px', margin: 0,
                  color: isLoading ? 'var(--text-muted)' : st.color,
                  fontFamily: 'JetBrains Mono, monospace',
                  opacity: isLoading ? 0.5 : 0.85,
                }}>
                  {isLoading ? '·····' : st.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}