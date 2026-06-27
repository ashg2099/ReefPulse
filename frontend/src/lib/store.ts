import { create } from 'zustand'

interface Location { lat: number; lon: number }
export type Tab = 'Overview' | 'Forecast' | 'History' | 'Alerts' | 'Species'

interface ReefStore {
  selectedLocation: Location
  setSelectedLocation: (loc: Location) => void
  lat: number
  lon: number
  isDark: boolean
  toggleDark: () => void
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export const useReefStore = create<ReefStore>((set) => ({
  selectedLocation: { lat: -18.0, lon: 147.0 },
  setSelectedLocation: (loc) => set({ selectedLocation: loc, lat: loc.lat, lon: loc.lon }),
  lat: -18.0,
  lon: 147.0,
  isDark: false,
  toggleDark: () => set((s) => ({ isDark: !s.isDark })),
  activeTab: 'Overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))