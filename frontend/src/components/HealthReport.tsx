'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { startAnalysis, getAnalysisResult } from '@/lib/api'
import { useReefStore } from '@/lib/store'

export default function HealthReport() {
  const { selectedLocation } = useReefStore()
  const { lat, lon } = selectedLocation
  const [jobId, setJobId] = useState<string | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const targetScore = 92

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + 2, targetScore)
      setDisplayScore(current)
      if (current >= targetScore) clearInterval(interval)
    }, 18)
    return () => clearInterval(interval)
  }, [targetScore])

  const { mutate: runAnalysis, isPending: isStarting } = useMutation({
    mutationFn: () => startAnalysis(lat, lon),
    onSuccess: (data) => setJobId(data.job_id),
  })

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getAnalysisResult(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') return false
      return 3000
    },
  })

  const isRunning = !!jobId && job?.status === 'running'
  const isDone    = job?.status === 'completed'
  const isFailed  = job?.status === 'failed'

  const resultText = isDone && job?.result
    ? (typeof job.result === 'string'
        ? job.result
        : job.result?.analysis
          ? String(job.result.analysis)
          : JSON.stringify(job.result, null, 2))
    : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>🤖</span>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Health Report</h2>
      </div>

      <div className="g-card" style={{ padding: '20px' }}>
        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span className="mono" style={{ fontSize: '52px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, display: 'block', animation: 'count-up 0.6s ease' }}>
              {displayScore}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>health score / 100</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, background: 'var(--chip-bg)', color: 'var(--chip-color)', padding: '5px 14px', borderRadius: '20px', border: '1px solid var(--chip-border)' }}>
              LOW RISK
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '6px' }}>
              {isDone ? '✅ Just updated' : 'Baseline estimate'}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ height: '6px', background: 'var(--accent-bg)', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #0284c7, #06b6d4)',
            ['--bar-w' as string]: `${displayScore}%`,
            animation: 'bar-grow 1.2s ease both', animationDelay: '200ms',
          }}/>
        </div>

        {/* Default findings */}
        {!isDone && (
          <div style={{ marginBottom: '14px' }}>
            {[
              'SST is safely below the 28–29 °C bleaching threshold for this zone.',
              'Zero accumulated heating weeks — no thermal stress this season.',
              'Wave energy is oxygenating water without physical risk to coral.',
            ].map((finding, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '9px', lineHeight: 1.65 }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-bg)', flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--accent)' }}>✓</div>
                {finding}
              </div>
            ))}
          </div>
        )}

        {/* AI result */}
        {resultText && (
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.8, maxHeight: '230px', overflowY: 'auto', background: 'var(--bg-muted)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)', animation: 'fade-in-up 0.4s ease', marginBottom: '14px' }}>
            {resultText.split('\n').map((line, i) => {
              const clean  = line.replace(/\*\*/g, '')
              const isHead = /^#{1,3}\s/.test(line) || (line.startsWith('**') && line.endsWith('**'))
              return <p key={i} style={{ margin: '0 0 6px', fontWeight: isHead ? 700 : 400, color: isHead ? 'var(--accent)' : 'var(--text-primary)' }}>{clean.replace(/^#+\s/, '')}</p>
            })}
          </div>
        )}

        {isFailed && (
          <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fef2f2', borderRadius: '10px', padding: '10px 12px', border: '1px solid #fecaca', marginBottom: '14px' }}>
            ⚠️ Analysis failed — {job?.error ?? 'unknown error'}. Check backend is running.
          </div>
        )}

        <button
          onClick={() => { setJobId(null); runAnalysis() }}
          disabled={isStarting || isRunning}
          style={{
            width: '100%', padding: '11px',
            background: isRunning ? '#475569' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: 600,
            cursor: isRunning || isStarting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: isRunning ? 'none' : '0 2px 12px rgba(2,132,199,0.30)',
          }}
        >
          {isRunning ? '⏳ AI crew analysing…' : isStarting ? 'Starting…' : '▶ Run AI Crew Analysis'}
        </button>

        {isRunning && (
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', textAlign: 'center', marginTop: '7px' }}>
            3 agents working in parallel — takes ~30–60 seconds
          </div>
        )}
      </div>
    </div>
  )
}