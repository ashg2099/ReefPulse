'use client'
import { useQuery } from '@tanstack/react-query'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface CVMetric { mean: number; std: number }
interface Metrics {
  model:       { algorithm: string; regularisation: string; features: string[]; trained_on: string; note: string }
  test:        { n_samples: number; n_bleaching: number; accuracy: number; precision: number; recall: number; f1: number; roc_auc: number; pr_auc: number }
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number }
  cross_validation: { folds: number; roc_auc: CVMetric & { per_fold: number[] }; f1: CVMetric; precision: CVMetric; recall: CVMetric }
  feature_importance: Array<{ feature: string; coefficient: number; abs: number }>
  training:    { total_samples: number; train_samples: number; test_samples: number; bleaching_pct: number; safe_pct: number }
}

function MetricChip({ label, value, sub, good }: { label: string; value: string; sub?: string; good: boolean }) {
  return (
    <div className="g-card" style={{ padding: '14px 12px', textAlign: 'center', flex: 1, minWidth: '90px' }}>
      <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: good ? '#22c55e' : '#f59e0b', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{sub}</div>}
    </div>
  )
}

function ConfusionMatrix({ cm }: { cm: Metrics['confusion_matrix'] }) {
  const total = cm.tn + cm.fp + cm.fn + cm.tp
  const Cell = ({ label, value, good, bg }: { label: string; value: number; good: boolean; bg: string }) => (
    <div style={{ padding: '12px 8px', textAlign: 'center', borderRadius: '10px', background: bg, border: '1px solid var(--border)' }}>
      <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: good ? '#22c55e' : '#ef4444' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'pre-line' }}>{label}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{((value / total) * 100).toFixed(1)}%</div>
    </div>
  )
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <Cell label={'True Negative\n(Correctly safe)'}  value={cm.tn} good={true}  bg="var(--accent-bg)" />
        <Cell label={'False Positive\n(False alarm)'}    value={cm.fp} good={false} bg="#fef3c7" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <Cell label={'False Negative\n(Missed bleach)'}  value={cm.fn} good={false} bg="#fef2f2" />
        <Cell label={'True Positive\n(Caught bleach)'}   value={cm.tp} good={true}  bg="#f0fdf4" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>← Predicted No Stress</span>
        <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>Predicted Bleaching →</span>
      </div>
    </div>
  )
}

function CVFoldBars({ scores }: { scores: number[] }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '44px' }}>
      {scores.map((s, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>{s.toFixed(3)}</span>
          <div style={{
            width: '100%', borderRadius: '3px 3px 0 0', minHeight: '4px',
            background: s > 0.90 ? '#22c55e' : s > 0.80 ? '#f59e0b' : '#ef4444',
            height: `${Math.max(4, (s - 0.5) / 0.5 * 30)}px`,
          }}/>
          <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>F{i + 1}</span>
        </div>
      ))}
    </div>
  )
}

function FeatureImportance({ features }: { features: Metrics['feature_importance'] }) {
  const maxAbs = Math.max(...features.map(f => f.abs), 0.0001)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {features.map(f => (
        <div key={f.feature}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{f.feature}</span>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: f.coefficient > 0 ? '#ef4444' : '#0284c7' }}>
              {f.coefficient > 0 ? '+' : ''}{f.coefficient.toFixed(4)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '8px' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              {f.coefficient < 0 && (
                <div style={{ height: '8px', borderRadius: '4px', background: '#0284c7', width: `${(f.abs / maxAbs) * 100}%` }}/>
              )}
            </div>
            <div style={{ width: '1px', height: '14px', background: 'var(--border)', flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              {f.coefficient > 0 && (
                <div style={{ height: '8px', borderRadius: '4px', background: '#ef4444', width: `${(f.abs / maxAbs) * 100}%` }}/>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>← lowers risk</span>
            <span style={{ fontSize: '9px', color: 'var(--text-subtle)' }}>raises risk →</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <section style={{ padding: '28px', borderBottom: '1px solid var(--border)' }}>
      <div className="skeleton" style={{ width: '200px', height: '16px', marginBottom: '20px' }}/>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton g-card" style={{ flex: 1, height: '72px' }}/>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '12px' }}/>)}
      </div>
    </section>
  )
}

export default function ModelCard() {
  const { data, isLoading, isError } = useQuery<Metrics>({
    queryKey: ['model-metrics'],
    queryFn:  () => fetch(`${API}/model/metrics`).then(r => { if (!r.ok) throw new Error(); return r.json() }),
    staleTime: Infinity,
  })

  if (isLoading) return <Skeleton />
  if (isError || !data) return (
    <section style={{ padding: '28px', borderBottom: '1px solid var(--border)' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>⚠️ Model metrics unavailable — is the backend running?</p>
    </section>
  )

  const { test, cross_validation: cv, confusion_matrix: cm, feature_importance, training } = data
  const cvStable = cv.roc_auc.std < 0.03

  return (
    <section style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Model Evaluation Card</h2>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', background: 'var(--chip-bg)', color: 'var(--chip-color)', border: '1px solid var(--chip-border)' }}>
          {data.model.algorithm} · {data.model.regularisation}
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Evaluated on held-out 20% test set (n={test.n_samples}, {test.n_bleaching} bleaching events) + {cv.folds}-fold stratified CV.
        Training: {training.total_samples} samples — {training.safe_pct}% safe / {training.bleaching_pct}% bleaching.
      </p>

      {/* Key metric chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <MetricChip label="ROC-AUC"   value={test.roc_auc.toFixed(3)}   sub="test set"           good={test.roc_auc   > 0.85} />
        <MetricChip label="PR-AUC"    value={test.pr_auc.toFixed(3)}    sub="imbalanced classes" good={test.pr_auc    > 0.70} />
        <MetricChip label="F1 Score"  value={test.f1.toFixed(3)}        sub="harmonic mean"      good={test.f1        > 0.75} />
        <MetricChip label="Precision" value={test.precision.toFixed(3)} sub="false alarm rate"   good={test.precision > 0.75} />
        <MetricChip label="Recall"    value={test.recall.toFixed(3)}    sub="missed events"      good={test.recall    > 0.75} />
        <MetricChip label="Accuracy"  value={test.accuracy.toFixed(3)}  sub="(misleading alone)" good={test.accuracy  > 0.85} />
      </div>

      {/* Three-column detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

        {/* Confusion matrix */}
        <div className="g-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>🎯 Confusion Matrix</div>
          <ConfusionMatrix cm={cm} />
          <div style={{ marginTop: '12px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-muted)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            FN={cm.fn} missed bleaching events is the critical failure mode. FP={cm.fp} false alarms are less harmful — better to over-warn.
          </div>
        </div>

        {/* CV fold bars */}
        <div className="g-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>🔁 {cv.folds}-Fold CV · ROC-AUC</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {cvStable ? '✅ Stable across folds — no overfitting' : '⚠️ High variance across folds'}
          </div>
          <CVFoldBars scores={cv.roc_auc.per_fold} />
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {([
              { label: 'ROC-AUC',  m: cv.roc_auc },
              { label: 'F1',       m: cv.f1 },
              { label: 'Precision',m: cv.precision },
              { label: 'Recall',   m: cv.recall },
            ] as const).map(({ label, m }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {m.mean.toFixed(3)} <span style={{ color: 'var(--text-subtle)' }}>± {m.std.toFixed(3)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature importance */}
        <div className="g-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>📊 Feature Coefficients</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Standardised LR weights. Red = raises bleaching risk, blue = lowers it.
          </div>
          <FeatureImportance features={feature_importance} />
        </div>
      </div>

      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-subtle)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text-muted)' }}>Note:</strong> {data.model.note}<br/>
        Training basis: {data.model.trained_on}.
      </div>
    </section>
  )
}