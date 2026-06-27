'use client'
import { useReefStore } from '@/lib/store'
import HeroOcean from './HeroOcean'
import QuickStats from './QuickStats'
import ReefMap from './ReefMap'
import HealthReport from './HealthReport'
import ThermalSection from './ThermalSection'
import MarineSection from './MarineSection'
import RightPanel from './RightPanel'
import ForecastPage from './ForecastPage'
import HistoryPage from './HistoryPage'
import SpeciesRiskPage from './SpeciesRiskPage'

function OverviewContent() {
  return (
    <>
      <HeroOcean />
      <QuickStats />

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', borderBottom: '1px solid var(--border)' }}>
        <div style={{ borderRight: '1px solid var(--border)', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px' }}>🗺️</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Reef Network</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>— click a station to switch</span>
          </div>
          <ReefMap />
        </div>
        <div style={{ padding: '28px', background: 'var(--bg-section)' }}>
          <HealthReport />
        </div>
      </div>

      <ThermalSection />
      <MarineSection />
      <RightPanel />

      <div style={{
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        padding: '16px 28px', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap',
      }}>
        {['🧠 Llama 3.3 70B via Groq', '📚 773-doc RAG knowledge base', '🤖 3-agent CrewAI system', '🎯 SDG 14: Life Below Water'].map(item => (
          <span key={item} style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>{item}</span>
        ))}
      </div>
    </>
  )
}

function ComingSoon({ tab }: { tab: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🚧</div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{tab} — coming soon</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>This tab is under construction.</p>
    </div>
  )
}

export default function TabContent() {
  const { activeTab } = useReefStore()
  if (activeTab === 'Forecast') return <ForecastPage />
  if (activeTab === 'History')  return <HistoryPage />
  if (activeTab === 'Alerts')   return <ComingSoon tab="Alerts" />
  if (activeTab === 'Species') return <SpeciesRiskPage />
  return <OverviewContent />
}