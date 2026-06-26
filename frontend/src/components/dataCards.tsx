'use client'

import { ReefSnapshot } from '@/lib/api'

// Bleaching alert colours
const alertColour = (level: number) => {
  if (level === 0) return 'text-green-400'
  if (level === 1) return 'text-yellow-400'
  if (level === 2) return 'text-orange-400'
  return 'text-red-500'
}

// A single stat card
function Card({ label, value, unit, colour = 'text-white' }: {
  label: string
  value: string | number
  unit?: string
  colour?: string
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-slate-400 text-xs uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold ${colour}`}>
        {value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </span>
    </div>
  )
}

export default function DataCards({ snapshot }: { snapshot: ReefSnapshot }) {
  const { thermal_stress, marine_conditions, weather } = snapshot

  return (
    <div className="space-y-4">
      {/* Thermal stress */}
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-2">🌡️ Thermal Stress</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card label="Sea Surface Temp" value={thermal_stress.sst_celsius} unit="°C" />
          <Card label="Degree Heating Weeks" value={thermal_stress.dhw_celsius_weeks} unit="°C-wks" />
          <Card
            label="Bleaching Alert"
            value={thermal_stress.bleaching_status}
            colour={alertColour(thermal_stress.bleaching_alert)}
          />
        </div>
      </div>

      {/* Marine conditions */}
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-2">🌊 Marine Conditions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card label="Wave Height" value={marine_conditions.wave_height_m} unit="m" />
          <Card label="Swell Height" value={marine_conditions.swell_wave_height_m} unit="m" />
          <Card label="Wave Period" value={marine_conditions.wave_period_s} unit="s" />
        </div>
      </div>

      {/* Weather */}
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-2">💨 Weather</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card label="Air Temperature" value={weather.air_temp_celsius} unit="°C" />
          <Card label="Wind Speed" value={weather.wind_speed_kmh} unit="km/h" />
          <Card label="Humidity" value={weather.humidity_pct} unit="%" />
        </div>
      </div>

      {/* Sources */}
      <p className="text-slate-500 text-xs">
        Sources: {snapshot.data_sources.join(' · ')}
      </p>
    </div>
  )
}