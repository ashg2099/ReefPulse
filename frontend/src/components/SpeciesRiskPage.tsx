'use client'
import { useQuery } from '@tanstack/react-query'
import { useReefStore } from '@/lib/store'

const API = process.env.NEXT_PUBLIC_API_URL

const STRESS_CONFIG = {
  0: { label: 'No Stress', bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800', bar: 'bg-green-500' },
  1: { label: 'Watch', bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' },
  2: { label: 'Bleaching Alert', bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800', bar: 'bg-orange-500' },
  3: { label: 'Severe Stress', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
}

export default function SpeciesRiskPage() {
  const { lat, lon } = useReefStore()

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Species Risk Assessment</h2>
        <p className="text-gray-500 text-sm mt-1">
          Thermal stress for {summary?.total ?? '—'} GBR coral species · SST {sst != null ? `${sst}°C` : '—'} · DHW {dhw != null ? `${dhw} °C-wks` : '—'}
        </p>
      </div>

      {summary && (
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'no_stress', level: 0 },
            { key: 'watch', level: 1 },
            { key: 'alert', level: 2 },
            { key: 'severe', level: 3 },
          ].map(({ key, level }) => {
            const cfg = STRESS_CONFIG[level as keyof typeof STRESS_CONFIG]
            return (
              <div key={key} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${cfg.bg} ${cfg.badge}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.bar}`} />
                {summary[key as keyof typeof summary]} {cfg.label}
              </div>
            )
          })}
        </div>
      )}

      {speciesQ.isLoading || forecastQ.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : speciesQ.isError ? (
        <p className="text-red-500">Failed to load species data.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.species?.map((sp: any) => {
            const cfg = STRESS_CONFIG[sp.stress_level as keyof typeof STRESS_CONFIG]
            return (
              <div key={sp.id} className={`rounded-xl border p-4 space-y-3 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-800 italic">{sp.name}</p>
                    <p className="text-xs text-gray-500">{sp.common} · {sp.family}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
                    {sp.stress_label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <p className="text-gray-400">Bleach threshold</p>
                    <p className="font-mono font-bold text-gray-700">{sp.bleach_threshold}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Above threshold</p>
                    <p className="font-mono font-bold text-gray-700">+{sp.sst_above_threshold}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Sensitivity</p>
                    <p className="font-mono font-bold text-gray-700 capitalize">{sp.sensitivity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">OBIS records</p>
                    <p className="font-mono font-bold text-gray-700">{sp.obis_records?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="w-full bg-white/70 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${cfg.bar}`}
                    style={{ width: `${Math.min(sp.stress_score * 100, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}