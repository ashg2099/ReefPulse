'use client'
import { useQuery } from '@tanstack/react-query'
import { useReefStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const STATIONS = [
  { id: 'central_gbr',   name: 'Central GBR',  code: 'CGBR', lat: -18.0, lon: 147.0 },
  { id: 'cairns',        name: 'Cairns',        code: 'CRNS', lat: -16.9, lon: 145.8 },
  { id: 'cooktown',      name: 'Cooktown',      code: 'CKTW', lat: -15.5, lon: 145.3 },
  { id: 'whitsundays',   name: 'Whitsundays',   code: 'WHIT', lat: -20.2, lon: 148.9 },
  { id: 'capricorn',     name: 'Capricorn',     code: 'CAPR', lat: -23.5, lon: 151.9 },
  { id: 'torres_strait', name: 'Torres Strait', code: 'TRRS', lat: -10.6, lon: 142.2 },
]

type Status = 'healthy' | 'watch' | 'alert' | 'severe' | 'loading'
const LEVEL_TO_STATUS: Record<number, Status> = { 0:'healthy', 1:'watch', 2:'alert', 3:'severe' }
const ST: Record<Status, { c: string; g: string; label: string }> = {
  healthy: { c: '#00e5b0', g: '#00e5b030', label: 'NO STRESS' },
  watch:   { c: '#f59e0b', g: '#f59e0b30', label: 'WATCH'     },
  alert:   { c: '#ef4444', g: '#ef444430', label: 'ALERT'     },
  severe:  { c: '#c084fc', g: '#c084fc30', label: 'SEVERE'    },
  loading: { c: '#334155', g: '#33415530', label: '···'       },
}

const LAT_MAX = -10.0, LAT_MIN = -24.5, LON_MIN = 141.5, LON_MAX = 153.5
function px(lat: number, lon: number) {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 480 + 10,
    y: ((lat - LAT_MAX) / (LAT_MIN - LAT_MAX)) * 300 + 10,
  }
}

// Center point for radar (Central GBR)
const CX = 230, CY = 175

export default function ReefMap() {
  const { lat, lon, setSelectedLocation } = useReefStore()

  const { data, isLoading } = useQuery({
    queryKey: ['alerts-map'],
    queryFn: async () => {
      const r = await fetch(`${API}/alerts`)
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const levelById: Record<string, number> = {}
  if (data?.stations) for (const s of data.stations) levelById[s.id] = s.alert_level ?? 0

  const getStatus = (id: string): Status => {
    if (isLoading) return 'loading'
    const lv = levelById[id]
    return lv !== undefined ? (LEVEL_TO_STATUS[lv] ?? 'healthy') : 'healthy'
  }

  const isSel = (s: typeof STATIONS[0]) =>
    Math.abs(lat - s.lat) < 0.15 && Math.abs(lon - s.lon) < 0.15

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e5b0',
          boxShadow:'0 0 6px #00e5b0', animation:'pulse-dot 2s ease-in-out infinite' }}/>
        <span style={{ fontSize:'10px', fontWeight:700, color:'#00e5b0',
          textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'JetBrains Mono, monospace' }}>
          Live Monitoring — {STATIONS.length} Stations
        </span>
      </div>

      {/* Map container */}
      <div style={{
        position:'relative', borderRadius:'12px', overflow:'hidden',
        background:'#030c18',
        border:'1px solid rgba(0,212,255,0.15)',
        boxShadow:'0 0 40px rgba(0,180,220,0.08), inset 0 1px 0 rgba(0,212,255,0.1)',
      }}>
        {/* HUD corner brackets */}
        {[
          { top:0, left:0,   borderTop:'2px solid #00d4ff', borderLeft:'2px solid #00d4ff' },
          { top:0, right:0,  borderTop:'2px solid #00d4ff', borderRight:'2px solid #00d4ff' },
          { bottom:0, left:0,  borderBottom:'2px solid #00d4ff', borderLeft:'2px solid #00d4ff' },
          { bottom:0, right:0, borderBottom:'2px solid #00d4ff', borderRight:'2px solid #00d4ff' },
        ].map((style, i) => (
          <div key={i} style={{
            position:'absolute', width:'14px', height:'14px', zIndex:10, opacity:0.6, ...style
          }}/>
        ))}

        <svg width="100%" viewBox="0 0 500 320" style={{ display:'block' }}>
          <defs>
            {/* Circuit dot-grid */}
            <pattern id="dotgrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.7" fill="rgba(0,212,255,0.18)"/>
              <line x1="0" y1="0" x2="30" y2="0" stroke="rgba(0,212,255,0.05)" strokeWidth="0.4"/>
              <line x1="0" y1="0" x2="0" y2="30" stroke="rgba(0,212,255,0.05)" strokeWidth="0.4"/>
            </pattern>

            {/* Radar sweep gradient */}
            <radialGradient id="sweepGrad" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0"/>
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.5"/>
            </radialGradient>

            {/* Outer ocean depth gradient */}
            <radialGradient id="depthGrad" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#0a2540" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#030c18" stopOpacity="0"/>
            </radialGradient>

            {/* Glow filters */}
            <filter id="glow-sm" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-lg" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="reef-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Base fill */}
          <rect width="500" height="320" fill="#030c18"/>
          <rect width="500" height="320" fill="url(#depthGrad)"/>
          <rect width="500" height="320" fill="url(#dotgrid)"/>

          {/* Concentric range rings from Central GBR */}
          {[50, 100, 160, 230].map((r, i) => (
            <circle key={r} cx={CX} cy={CY} r={r}
              fill="none"
              stroke="rgba(0,180,220,0.09)"
              strokeWidth="0.6"
              strokeDasharray={i % 2 === 0 ? 'none' : '4,4'}
            />
          ))}

          {/* Radar sweep — rotates from Central GBR */}
          <g>
            <path d={`M ${CX} ${CY} L ${CX + 240} ${CY} A 240 240 0 0 1 ${CX + 240 * Math.cos(-Math.PI/6)} ${CY + 240 * Math.sin(-Math.PI/6)} Z`}
              fill="url(#sweepGrad)" opacity="0.25">
              <animateTransform attributeName="transform" type="rotate"
                from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="7s" repeatCount="indefinite"/>
            </path>
            {/* Sweep leading edge */}
            <line x1={CX} y1={CY} x2={CX + 240} y2={CY}
              stroke="#00d4ff" strokeWidth="0.8" opacity="0.4">
              <animateTransform attributeName="transform" type="rotate"
                from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="7s" repeatCount="indefinite"/>
            </line>
          </g>

          {/* Lat reference lines */}
          {[-12, -15, -18, -21, -24].map(lat => {
            const y = ((lat - LAT_MAX) / (LAT_MIN - LAT_MAX)) * 300 + 10
            return (
              <g key={lat}>
                <line x1="36" y1={y} x2="500" y2={y}
                  stroke="rgba(0,212,255,0.08)" strokeWidth="0.5"/>
                <text x="33" y={y + 3} fontSize="7" fill="rgba(0,212,255,0.3)"
                  textAnchor="end" fontFamily="JetBrains Mono, monospace">
                  {Math.abs(lat)}°S
                </text>
              </g>
            )
          })}

          {/* Lon reference lines */}
          {[142, 144, 146, 148, 150, 152].map(lon => {
            const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 480 + 10
            return (
              <g key={lon}>
                <line x1={x} y1="0" x2={x} y2="296"
                  stroke="rgba(0,212,255,0.08)" strokeWidth="0.5"/>
                <text x={x} y="309" fontSize="7" fill="rgba(0,212,255,0.3)"
                  textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                  {lon}°E
                </text>
              </g>
            )
          })}

          {/* Australia — Queensland coast */}
          <path
            d="M 38 20 Q 34 38 48 56 Q 62 74 82 78 Q 102 88 120 104 Q 150 118 172 140 Q 192 162 210 180 Q 232 202 258 210 Q 278 218 296 234 Q 326 254 362 278 Q 382 290 400 306 L 30 306 L 30 20 Z"
            fill="rgba(15,30,60,0.55)"
            stroke="rgba(0,180,220,0.2)"
            strokeWidth="1"
          />
          <text x="76" y="200" fontSize="8" fill="rgba(0,180,220,0.2)"
            textAnchor="middle" fontFamily="JetBrains Mono, monospace" transform="rotate(-72,76,200)">
            QUEENSLAND
          </text>

          {/* GBR Reef — outer edge path */}
          <path
            d="M 60 28 Q 100 36 132 52 Q 162 66 188 88 Q 210 110 226 136 Q 244 162 256 188 Q 270 214 290 236 Q 316 260 348 278 Q 390 294 430 292"
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.2"
            strokeDasharray="8,5"
            opacity="0.55"
            filter="url(#reef-glow)"
          />
          {/* GBR inner edge */}
          <path
            d="M 48 44 Q 82 52 112 70 Q 146 88 170 114 Q 192 140 206 168 Q 220 196 236 218 Q 256 240 280 260 Q 314 280 360 292"
            fill="none"
            stroke="#00d4ff"
            strokeWidth="0.5"
            strokeDasharray="4,8"
            opacity="0.2"
          />
          {/* GBR zone fill between paths */}
          <path
            d="M 60 28 Q 100 36 132 52 Q 162 66 188 88 Q 210 110 226 136 Q 244 162 256 188 Q 270 214 290 236 Q 316 260 348 278 Q 390 294 430 292 Q 360 292 314 280 Q 280 260 256 240 Q 236 218 220 196 Q 206 168 192 140 Q 170 114 146 88 Q 112 70 82 52 Q 48 44 48 44 Z"
            fill="rgba(0,180,220,0.04)"
          />

          {/* Station connection lines */}
          {STATIONS.slice(1).map(s => {
            const from = px(STATIONS[0].lat, STATIONS[0].lon) // Central GBR as hub
            const to = px(s.lat, s.lon)
            return (
              <line key={s.id}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="rgba(0,212,255,0.08)"
                strokeWidth="0.5"
                strokeDasharray="3,6"
              />
            )
          })}

          {/* Station markers */}
          {STATIONS.map(s => {
            const { x, y } = px(s.lat, s.lon)
            const sel = isSel(s)
            const status = getStatus(s.id)
            const st = ST[status]

            return (
              <g key={s.id} onClick={() => setSelectedLocation({ lat: s.lat, lon: s.lon })} style={{ cursor:'pointer' }}>
                {/* Glow base */}
                <circle cx={x} cy={y} r="12" fill={st.g}/>

                {/* Outer ring — always visible */}
                <circle cx={x} cy={y} r={sel ? 9 : 7}
                  fill="none" stroke={st.c} strokeWidth={sel ? 1.2 : 0.8} opacity={sel ? 0.9 : 0.5}
                  filter="url(#glow-sm)"
                />

                {/* Crosshairs */}
                <line x1={x - (sel ? 13 : 10)} y1={y} x2={x - (sel ? 4 : 3)} y2={y}
                  stroke={st.c} strokeWidth="0.8" opacity={sel ? 0.8 : 0.4}/>
                <line x1={x + (sel ? 4 : 3)} y1={y} x2={x + (sel ? 13 : 10)} y2={y}
                  stroke={st.c} strokeWidth="0.8" opacity={sel ? 0.8 : 0.4}/>
                <line x1={x} y1={y - (sel ? 13 : 10)} x2={x} y2={y - (sel ? 4 : 3)}
                  stroke={st.c} strokeWidth="0.8" opacity={sel ? 0.8 : 0.4}/>
                <line x1={x} y1={y + (sel ? 4 : 3)} x2={x} y2={y + (sel ? 13 : 10)}
                  stroke={st.c} strokeWidth="0.8" opacity={sel ? 0.8 : 0.4}/>

                {/* Pulse expand for selected */}
                {sel && (
                  <circle cx={x} cy={y} r="9" fill="none" stroke={st.c} strokeWidth="1" opacity="0">
                    <animate attributeName="r" values="9;20;9" dur="2.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Alert slow pulse */}
                {!sel && (status === 'alert' || status === 'severe') && (
                  <circle cx={x} cy={y} r="7" fill="none" stroke={st.c} strokeWidth="0.8" opacity="0">
                    <animate attributeName="r" values="7;16;7" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Core dot */}
                <circle cx={x} cy={y} r={sel ? 3 : 2} fill={st.c}
                  opacity={isLoading ? 0.3 : 1} filter={sel ? 'url(#glow-lg)' : 'url(#glow-sm)'}/>

                {/* Label panel */}
                {(() => {
                  const labelRight = x < 350
                  const lx = labelRight ? x + 14 : x - 14
                  const anchor = labelRight ? 'start' : 'end'
                  const boxW = s.name.length * 5.2 + 12
                  const bx = labelRight ? lx - 4 : lx - boxW + 4
                  return (
                    <>
                      <rect x={bx} y={y - 11} width={boxW} height="16" rx="2"
                        fill="rgba(3,12,24,0.85)"
                        stroke={sel ? st.c + '99' : 'rgba(0,212,255,0.15)'}
                        strokeWidth={sel ? '0.8' : '0.4'}
                      />
                      <text x={lx} y={y - 1} fontSize="7.5"
                        fill={sel ? st.c : 'rgba(180,220,240,0.8)'}
                        fontWeight={sel ? '700' : '400'}
                        textAnchor={anchor}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {sel ? `▸ ${s.name}` : s.name}
                      </text>
                    </>
                  )
                })()}
              </g>
            )
          })}

          {/* Coral Sea label */}
          <text x="420" y="145" fontSize="9" fill="rgba(0,180,220,0.15)"
            textAnchor="middle" fontStyle="italic" fontFamily="serif">
            Coral Sea
          </text>

          {/* Compass */}
          <g transform="translate(474, 26)">
            <circle cx="0" cy="0" r="12"
              fill="rgba(3,12,24,0.8)" stroke="rgba(0,212,255,0.25)" strokeWidth="0.8"/>
            <line x1="0" y1="-8" x2="0" y2="8" stroke="rgba(0,212,255,0.4)" strokeWidth="0.5"/>
            <line x1="-8" y1="0" x2="8" y2="0" stroke="rgba(0,212,255,0.4)" strokeWidth="0.5"/>
            <polygon points="0,-7 2,0 0,-2 -2,0" fill="#00d4ff" opacity="0.9"/>
            <text x="0" y="-9" fontSize="6" fill="#00d4ff" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="700">N</text>
          </g>

          {/* Scale bar */}
          <g transform="translate(38, 296)">
            <line x1="0" y1="0" x2="56" y2="0" stroke="rgba(0,212,255,0.3)" strokeWidth="0.8"/>
            <line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(0,212,255,0.3)" strokeWidth="0.8"/>
            <line x1="56" y1="-3" x2="56" y2="3" stroke="rgba(0,212,255,0.3)" strokeWidth="0.8"/>
            <text x="28" y="-5" fontSize="6.5" fill="rgba(0,212,255,0.3)"
              textAnchor="middle" fontFamily="JetBrains Mono, monospace">280 KM</text>
          </g>

          {/* Top status bar */}
          <rect x="0" y="0" width="500" height="18" fill="rgba(0,212,255,0.04)"/>
          <text x="10" y="12" fontSize="7" fill="rgba(0,212,255,0.4)"
            fontFamily="JetBrains Mono, monospace" fontWeight="600">
            REEFPULSE // GBR MONITORING NETWORK // AUS-QLD
          </text>
          <circle cx="484" cy="9" r="3" fill={isLoading ? '#334155' : '#00e5b0'} opacity="0.9">
            {!isLoading && <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite"/>}
          </circle>
        </svg>
      </div>

      {/* Station selector cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'5px', marginTop:'8px' }}>
        {STATIONS.map(s => {
          const sel = isSel(s)
          const status = getStatus(s.id)
          const st = ST[status]
          return (
            <div key={s.id}
              onClick={() => setSelectedLocation({ lat: s.lat, lon: s.lon })}
              style={{
                padding:'7px 10px', borderRadius:'8px', cursor:'pointer',
                border:`1px solid ${sel ? st.c + '60' : 'var(--border)'}`,
                background: sel ? `linear-gradient(135deg, ${st.g}, transparent)` : 'var(--bg-card)',
                transition:'all 0.15s',
                display:'flex', alignItems:'center', gap:'8px',
              }}
            >
              {/* Status dot */}
              <div style={{
                width:'7px', height:'7px', borderRadius:'50%', flexShrink:0,
                background: isLoading ? '#334155' : st.c,
                boxShadow: sel && !isLoading ? `0 0 8px ${st.c}` : 'none',
                opacity: isLoading ? 0.4 : 1,
              }}/>
              <div style={{ minWidth:0 }}>
                <p style={{
                  fontSize:'10.5px', fontWeight: sel ? 700 : 500,
                  color: sel ? st.c : 'var(--text-primary)',
                  margin:0, lineHeight:1.2,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                }}>
                  {s.name}
                </p>
                <p style={{
                  fontSize:'8.5px', margin:0,
                  color: isLoading ? 'var(--text-muted)' : st.c,
                  fontFamily:'JetBrains Mono, monospace',
                  opacity: isLoading ? 0.5 : 0.75,
                }}>
                  {isLoading ? '···' : st.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}