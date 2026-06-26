'use client'

const DATA = [
  { day: 'Jun 17', temp: 25.8  },
  { day: 'Jun 18', temp: 25.5  },
  { day: 'Jun 19', temp: 25.9  },
  { day: 'Jun 20', temp: 25.3  },
  { day: 'Jun 21', temp: 25.7  },
  { day: 'Jun 22', temp: 25.4  },
  { day: 'Jun 23', temp: 25.26 },
]

export default function SSTChart() {
  const W = 320, H = 110
  const PAD = { top: 10, bottom: 24, left: 4, right: 44 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const temps = DATA.map(d => d.temp)
  const minT  = Math.min(...temps) - 0.4
  const maxT  = Math.max(...temps) + 0.4

  const x = (i: number) => PAD.left + (i / (DATA.length - 1)) * chartW
  const y = (t: number) => PAD.top + chartH - ((t - minT) / (maxT - minT)) * chartH

  const points   = DATA.map((d, i) => `${x(i)},${y(d.temp)}`).join(' ')
  const areaPath =
    `M${x(0)},${y(DATA[0].temp)} ` +
    DATA.slice(1).map((d, i) => `L${x(i + 1)},${y(d.temp)}`).join(' ') +
    ` L${x(DATA.length - 1)},${PAD.top + chartH} L${x(0)},${PAD.top + chartH} Z`

  const lastI = DATA.length - 1

  return (
    <div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.55 }}>
        Sustained readings above 28 °C trigger coral bleaching risk at this station.
      </p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="sstAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0284c7" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sstAreaGrad)" />
        <polyline points={points} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {DATA.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.temp)} r={i === lastI ? 5 : 3} fill={i === lastI ? '#0284c7' : '#bae6fd'} />
        ))}
        <circle cx={x(lastI)} cy={y(DATA[lastI].temp)} r="9" fill="none" stroke="#0284c7" strokeWidth="1.5" opacity="0.3"/>
        <text x={x(lastI) + 8} y={y(DATA[lastI].temp) - 5} fontSize="10" fill="#0284c7" fontWeight="700"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {DATA[lastI].temp}°C
        </text>
        <text x={x(0)}          y={H - 2} fontSize="8.5" fill="#94a3b8">{DATA[0].day}</text>
        <text x={x(3) - 13}     y={H - 2} fontSize="8.5" fill="#94a3b8">{DATA[3].day}</text>
        <text x={x(lastI) - 18} y={H - 2} fontSize="8.5" fill="#0284c7" fontWeight="600">Today</text>
      </svg>
    </div>
  )
}