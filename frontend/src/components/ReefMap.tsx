'use client'

import { useReefStore } from '@/lib/store'

const STATIONS = [
  { id: 'central',     name: 'Central GBR',  lat: -18.0, lon: 147.0, cx: 118, cy: 95,  color: '#1D9E75' },
  { id: 'cairns',      name: 'Cairns',        lat: -17.0, lon: 146.0, cx: 82,  cy: 58,  color: '#1D9E75' },
  { id: 'cooktown',    name: 'Cooktown',      lat: -15.5, lon: 145.5, cx: 62,  cy: 38,  color: '#1D9E75' },
  { id: 'whitsundays', name: 'Whitsundays',   lat: -20.0, lon: 148.5, cx: 152, cy: 127, color: '#EF9F27' },
  { id: 'capricorn',   name: 'Capricorn',     lat: -23.0, lon: 151.5, cx: 135, cy: 152, color: '#E24B4A' },
]

export default function ReefMap() {
  const { selectedLocation, setSelectedLocation } = useReefStore()

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: '10px', fontWeight: 500, color: '#0F6E56',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px',
      }}>
        🗺️ Reef network
      </div>

      <div style={{
        width: '100%', height: '185px', background: '#E6F1FB',
        borderRadius: '12px', border: '0.5px solid #B5D4F4',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Scanning line animation */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '1px',
          background: 'rgba(55,138,221,0.3)',
          animation: 'scan-line 3s linear infinite',
        }} />

        <svg width="100%" height="185" viewBox="0 0 260 185">
          {/* GBR shelf outline */}
          <path d="M50 30 Q80 20 120 28 Q160 18 195 32 Q200 55 190 90 Q178 125 155 145 Q130 160 105 158 Q78 155 58 138 Q38 120 35 90 Q30 60 40 42 Z"
            fill="#B5D4F4" opacity="0.6" />
          <path d="M105 45 Q135 40 155 58 Q158 78 143 93 Q120 97 100 87 Q82 77 86 62 Z" fill="#85B7EB" opacity="0.5" />
          <path d="M65 88 Q88 82 93 98 Q90 113 72 115 Q54 112 52 97 Z" fill="#85B7EB" opacity="0.4" />
          <path d="M155 60 Q168 56 174 68 Q172 80 162 81 Q150 79 148 68 Z" fill="#85B7EB" opacity="0.35" />

          {/* Station pins — clicking one updates Zustand, which re-triggers LeftPanel fetch */}
          {STATIONS.map((s) => {
            const selected = selectedLocation.lat === s.lat && selectedLocation.lon === s.lon
            return (
              <g key={s.id} onClick={() => setSelectedLocation({ lat: s.lat, lon: s.lon })}
                style={{ cursor: 'pointer' }}>
                {selected && (
                  <>
                    <circle cx={s.cx} cy={s.cy} r="11" fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.4" />
                    <circle cx={s.cx} cy={s.cy} r="17" fill="none" stroke={s.color} strokeWidth="0.8" opacity="0.2" />
                  </>
                )}
                <circle cx={s.cx} cy={s.cy} r={selected ? 6 : 4} fill={s.color} opacity="0.9" />
                <text x={s.cx + 8} y={s.cy - 3} fontSize="7.5"
                  fill={selected ? '#085041' : '#185FA5'}
                  fontWeight={selected ? '600' : '400'}>
                  {s.name}
                </text>
                {selected && (
                  <text x={s.cx + 8} y={s.cy + 7} fontSize="6.5" fill="#0F6E56">Selected</text>
                )}
              </g>
            )
          })}

          {/* Legend */}
          <rect x="8" y="148" width="78" height="32" rx="4" fill="#E6F1FB" stroke="#B5D4F4" strokeWidth="0.5" />
          <circle cx="18" cy="157" r="3.5" fill="#1D9E75" /><text x="25" y="160" fontSize="7" fill="#085041">Healthy</text>
          <circle cx="18" cy="168" r="3.5" fill="#EF9F27" /><text x="25" y="171" fontSize="7" fill="#085041">Watch</text>
          <circle cx="60" cy="157" r="3.5" fill="#E24B4A" /><text x="67" y="160" fontSize="7" fill="#085041">Alert</text>
        </svg>
      </div>
    </div>
  )
}