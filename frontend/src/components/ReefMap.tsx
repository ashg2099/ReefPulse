'use client'
import { useReefStore } from '@/lib/store'

const STATIONS = [
  { id: 'central',      name: 'Central GBR',    lat: -18.0, lon: 147.0, status: 'healthy' },
  { id: 'cairns',       name: 'Cairns',          lat: -16.9, lon: 145.8, status: 'healthy' },
  { id: 'cooktown',     name: 'Cooktown',        lat: -15.5, lon: 145.3, status: 'healthy' },
  { id: 'whitsundays',  name: 'Whitsundays',     lat: -20.2, lon: 148.9, status: 'watch'   },
  { id: 'capricorn',    name: 'Capricorn',       lat: -23.5, lon: 151.9, status: 'alert'   },
  { id: 'torres',       name: 'Torres Strait',   lat: -10.6, lon: 142.2, status: 'healthy' },
]

const STATUS = {
  healthy: { color: '#22c55e', glow: '#22c55e40', label: 'Healthy' },
  watch:   { color: '#f59e0b', glow: '#f59e0b40', label: 'Watch'   },
  alert:   { color: '#ef4444', glow: '#ef444440', label: 'Alert'   },
}

// Map lat/lon to SVG x/y within viewBox 0 0 500 320
const LAT_MIN = -24.5, LAT_MAX = -10.0
const LON_MIN = 141.5, LON_MAX = 153.5

function toSVG(lat: number, lon: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 480 + 10
  const y = ((lat - LAT_MAX) / (LAT_MIN - LAT_MAX)) * 300 + 10
  return { x, y }
}

export default function ReefMap() {
  const { selectedLocation, setSelectedLocation, lat, lon } = useReefStore()

  const isSelected = (s: typeof STATIONS[0]) =>
    Math.abs(lat - s.lat) < 0.1 && Math.abs(lon - s.lon) < 0.1

  return (
    <div style={{ width: '100%', fontFamily: 'inherit' }}>
      {/* Map container */}
      <div style={{
        width: '100%', borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(148,163,184,0.2)',
        background: 'linear-gradient(160deg, #0c1e35 0%, #0a2540 50%, #0d2137 100%)',
        position: 'relative',
      }}>
        <svg width="100%" viewBox="0 0 500 320" style={{ display: 'block' }}>
          <defs>
            {/* Ocean gradient */}
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#1e4d7b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0a2540" stopOpacity="0" />
            </radialGradient>
            {/* Grid pattern */}
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.5"/>
            </pattern>
            {/* Glow filters */}
            {Object.entries(STATUS).map(([key, s]) => (
              <filter key={key} id={`glow-${key}`}>
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            ))}
          </defs>

          {/* Background */}
          <rect width="500" height="320" fill="url(#oceanGrad)" />
          <rect width="500" height="320" fill="url(#grid)" />

          {/* Latitude lines with labels */}
          {[-12, -15, -18, -21, -24].map(latLine => {
            const y = ((latLine - LAT_MAX) / (LAT_MIN - LAT_MAX)) * 300 + 10
            return (
              <g key={latLine}>
                <line x1="30" y1={y} x2="500" y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" strokeDasharray="4,4"/>
                <text x="26" y={y + 3} fontSize="8" fill="rgba(148,163,184,0.4)" textAnchor="end">{Math.abs(latLine)}°S</text>
              </g>
            )
          })}

          {/* Longitude lines with labels */}
          {[142, 144, 146, 148, 150, 152].map(lonLine => {
            const x = ((lonLine - LON_MIN) / (LON_MAX - LON_MIN)) * 480 + 10
            return (
              <g key={lonLine}>
                <line x1={x} y1="0" x2={x} y2="295" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" strokeDasharray="4,4"/>
                <text x={x} y="308" fontSize="8" fill="rgba(148,163,184,0.4)" textAnchor="middle">{lonLine}°E</text>
              </g>
            )
          })}

          {/* GBR reef zone — approximate shape */}
          <path
            d="M 155 15 Q 175 20 195 35 Q 220 55 235 80 Q 248 108 252 135 Q 255 162 245 188 Q 230 215 210 228 Q 190 238 170 232 Q 148 225 132 208 Q 112 188 105 165 Q 96 140 98 115 Q 100 88 112 65 Q 125 40 140 25 Z"
            fill="rgba(6,182,212,0.06)"
            stroke="rgba(6,182,212,0.25)"
            strokeWidth="1"
            strokeDasharray="6,3"
          />
          <text x="178" y="120" fontSize="8" fill="rgba(6,182,212,0.4)" textAnchor="middle" fontWeight="500">GREAT BARRIER</text>
          <text x="178" y="130" fontSize="8" fill="rgba(6,182,212,0.4)" textAnchor="middle" fontWeight="500">REEF</text>

          {/* Australia coastline suggestion */}
          <path
            d="M 30 60 Q 45 55 65 68 Q 85 80 90 105 Q 95 135 85 160 Q 72 185 60 198 Q 45 210 30 205"
            fill="rgba(71,85,105,0.15)"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="1"
          />
          <text x="52" y="140" fontSize="7.5" fill="rgba(148,163,184,0.25)" textAnchor="middle" transform="rotate(-5, 52, 140)">AUSTRALIA</text>

          {/* Coral Sea label */}
          <text x="380" y="160" fontSize="9" fill="rgba(148,163,184,0.2)" textAnchor="middle" fontStyle="italic">Coral Sea</text>

          {/* Station markers */}
          {STATIONS.map((s) => {
            const { x, y } = toSVG(s.lat, s.lon)
            const sel = isSelected(s)
            const st = STATUS[s.status as keyof typeof STATUS]

            return (
              <g
                key={s.id}
                onClick={() => setSelectedLocation({ lat: s.lat, lon: s.lon })}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse rings for selected */}
                {sel && (
                  <>
                    <circle cx={x} cy={y} r="18" fill="none" stroke={st.color} strokeWidth="1" opacity="0.3">
                      <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx={x} cy={y} r="12" fill={st.glow} stroke={st.color} strokeWidth="1" opacity="0.4"/>
                  </>
                )}

                {/* Glow for alert stations */}
                {s.status !== 'healthy' && !sel && (
                  <circle cx={x} cy={y} r="8" fill={st.glow}/>
                )}

                {/* Main dot */}
                <circle
                  cx={x} cy={y}
                  r={sel ? 6 : 4.5}
                  fill={st.color}
                  opacity={sel ? 1 : 0.85}
                  filter={sel ? `url(#glow-${s.status})` : undefined}
                />
                {/* Inner dot */}
                <circle cx={x} cy={y} r={sel ? 2.5 : 1.8} fill="white" opacity="0.9"/>

                {/* Label */}
                <rect
                  x={x + 9} y={y - 10}
                  width={s.name.length * 5.2 + 8} height="14"
                  rx="3"
                  fill="rgba(12,30,53,0.75)"
                  stroke={sel ? st.color : 'rgba(148,163,184,0.15)'}
                  strokeWidth={sel ? '0.8' : '0.5'}
                />
                <text
                  x={x + 13} y={y}
                  fontSize="7.5"
                  fill={sel ? st.color : 'rgba(226,232,240,0.85)'}
                  fontWeight={sel ? '600' : '400'}
                >
                  {s.name}
                </text>
              </g>
            )
          })}

          {/* Compass rose */}
          <g transform="translate(460, 30)">
            <circle cx="0" cy="0" r="12" fill="rgba(12,30,53,0.6)" stroke="rgba(148,163,184,0.2)" strokeWidth="0.5"/>
            <text x="0" y="-4" fontSize="7" fill="rgba(226,232,240,0.7)" textAnchor="middle" fontWeight="600">N</text>
            <path d="M0,-2 L2,3 L0,1.5 L-2,3 Z" fill="rgba(226,232,240,0.6)"/>
          </g>

          {/* Scale bar */}
          <g transform="translate(35, 295)">
            <line x1="0" y1="0" x2="60" y2="0" stroke="rgba(148,163,184,0.4)" strokeWidth="1"/>
            <line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(148,163,184,0.4)" strokeWidth="1"/>
            <line x1="60" y1="-3" x2="60" y2="3" stroke="rgba(148,163,184,0.4)" strokeWidth="1"/>
            <text x="30" y="-5" fontSize="7" fill="rgba(148,163,184,0.4)" textAnchor="middle">~300 km</text>
          </g>
        </svg>
      </div>

      {/* Station list below map */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px', marginTop: '10px',
      }}>
        {STATIONS.map(s => {
          const sel = isSelected(s)
          const st = STATUS[s.status as keyof typeof STATUS]
          return (
            <div
              key={s.id}
              onClick={() => setSelectedLocation({ lat: s.lat, lon: s.lon })}
              style={{
                padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${sel ? st.color + '60' : 'var(--border)'}`,
                background: sel ? st.color + '12' : 'var(--bg-card)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}
            >
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: st.color, flexShrink: 0,
                boxShadow: sel ? `0 0 6px ${st.color}` : 'none',
              }}/>
              <div>
                <p style={{ fontSize: '11px', fontWeight: sel ? 700 : 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>{s.name}</p>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                  {Math.abs(s.lat)}°S {s.lon}°E
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}