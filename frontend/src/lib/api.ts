import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,  // 60 seconds: NOAA can be slow
})

export interface ReefSnapshot {
  location: { latitude: number; longitude: number }
  thermal_stress: {
    sst_celsius: number
    dhw_celsius_weeks: number
    bleaching_alert: number
    bleaching_status: string
  }
  marine_conditions: {
    wave_height_m: number
    swell_wave_height_m: number
    wave_period_s: number
    wave_direction_deg: number
  }
  weather: {
    air_temp_celsius: number
    wind_speed_kmh: number
    wind_direction: string
    humidity_pct: number
  }
  data_sources: string[]
}

export interface AnalysisJob {
  job_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: {
    location: { latitude: number; longitude: number }
    snapshot: ReefSnapshot
    analysis: string
  }
  error?: string
  created_at: number
  completed_at?: number
}

export const getSnapshot = async (lat = -18.0, lon = 147.0): Promise<ReefSnapshot> => {
  const { data } = await api.get('/snapshot', { params: { lat, lon } })
  return data
}

export const startAnalysis = async (latitude: number, longitude: number): Promise<{ job_id: string }> => {
  const { data } = await api.post('/analyse', { latitude, longitude })
  return data
}

export const getAnalysisResult = async (jobId: string): Promise<AnalysisJob> => {
  const { data } = await api.get(`/analyse/${jobId}`)
  return data
}

// Forecast types & fetcher

export interface RiskInfo {
    probability: number
    level: number        // 0=No Stress  1=Watch  2=Alert1  3=Alert2
    label: string
    color: string
  }
  
  export interface ForecastDay {
    short: string
    date:  string
    icon:  string
    sst:   number
    dhw:   number
    wave:  number
    swell: number
    wind:  number
    dir:   string
    risk:  RiskInfo
  }
  
  export interface ForecastData {
    location:     { lat: number; lon: number }
    generated_at: string
    days:         ForecastDay[]
    chart_data:   Array<{ label: string; sst: number; type: string; source?: string }>
    today_idx:    number
    current:      { sst: number; dhw: number }
    outlook:      { label: string; level: string }
    data_sources: Record<string, string>
    model_info:   { algorithm: string; features: string[]; trained_on: string }
  }
  
  export const getForecast = async (
    lat: number,
    lon: number,
    currentSst?: number,
    currentDhw?: number,
  ): Promise<ForecastData> => {
    const p = new URLSearchParams({ lat: String(lat), lon: String(lon) })
    if (currentSst != null) p.set('current_sst', String(currentSst))
    if (currentDhw != null) p.set('current_dhw', String(currentDhw))
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/forecast?${p}`
    )
    if (!res.ok) throw new Error('Forecast fetch failed')
    return res.json()
  }

  export interface MonthlySST {
    label: string; month: number; year: number
    mean: number; clim: number; anom: number
  }
  export interface DailySST {
    date: string; month: number; year: number
    sst: number; clim: number; anom: number
  }
  export interface BleachingEvent {
    year: number; name: string
    severity: number; severity_label: string
    pct_bleached: number; pct_mortality: number
    cause: string; recovery: string
    dhw_peak: number; color: string; citation: string
  }
  export interface HistoryData {
    location: { lat: number; lon: number }
    generated_at: string
    daily: DailySST[]
    monthly: MonthlySST[]
    summary: {
      days_fetched: number; peak_sst: number | null
      mean_anomaly: number | null; warm_days: number
      data_source: string
    }
    bleaching_events: BleachingEvent[]
  }
  
  export const getHistory = async (lat: number, lon: number): Promise<HistoryData> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/history?lat=${lat}&lon=${lon}`
    )
    if (!res.ok) throw new Error('History fetch failed')
    return res.json()
  }