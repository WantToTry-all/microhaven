import { generateDeterministicExplanation } from '../engine/matchingEngine.js'

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LAYER_ORDER = { tall: 0, medium: 1, low: 2 }
const LAYER_PLACEMENT = {
  tall: 'Back row, against wall',
  medium: 'Middle row',
  low: 'Front row, facing sun',
}

function fmt(s) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function PlanView({ result, onBack }) {
  const rec = result.recommendation
  const plants = [...rec.plants].sort(
    (a, b) => (LAYER_ORDER[a.height_layer] ?? 1) - (LAYER_ORDER[b.height_layer] ?? 1)
  )
  const explanation = generateDeterministicExplanation(result)
  const allSources = [...new Set(plants.flatMap(p => p.sources || []))]
  const bloomRange = rec.bloomMonths.length > 0
    ? `${MONTHS[rec.bloomMonths[0]]} – ${MONTHS[rec.bloomMonths[rec.bloomMonths.length - 1]]}`
    : 'Year-round structure'

  const handlePrint = () => window.print()

  return (
    <div className="plan-page">
      <div className="plan-card">
        <div className="plan-header">
          <div className="plan-logo">MicroHaven</div>
          <div className="plan-location">
            Portland, Oregon · Willamette Valley
            <br />
            {fmt(result.constraints.space_type)} · {result.constraints.width_ft}×{result.constraints.depth_ft} ft
          </div>
        </div>

        {/* Summary */}
        <div className="habitat-summary" style={{ borderTop: 'none' }}>
          <div className="summary-item">
            <span className="summary-value">{plants.length}</span>
            <span className="summary-label">Native plants</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">${rec.totalCost}</span>
            <span className="summary-label">Estimated cost</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{bloomRange}</span>
            <span className="summary-label">Bloom period</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{rec.pollinators.length}</span>
            <span className="summary-label">Pollinator types</span>
          </div>
        </div>

        {/* Plants */}
        <div className="plan-section">
          <div className="plan-section-label">Your plants</div>
          {plants.map((plant, i) => (
            <div key={plant.id} className="plan-plant-entry">
              <div className="plan-plant-num">{i + 1}</div>
              <div className="plan-plant-body">
                <h4>{plant.common_name}</h4>
                <div className="sci">{plant.scientific_name}</div>
                <div className="placement">
                  📍 {LAYER_PLACEMENT[plant.height_layer] || 'Flexible'} · {plant.mature_height_ft} ft tall · {plant.minimum_container_diameter_in}″ container
                </div>
                <div className="care">{plant.care_notes}</div>
                <div className="plan-tags-row">
                  {plant.pollinators.map(p => (
                    <span key={p} className="feed-tag">{fmt(p)}</span>
                  ))}
                  {plant.ecological_roles.map(r => (
                    <span key={r} className="source-tag">{fmt(r)}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Wildlife */}
        <div className="plan-section">
          <div className="plan-section-label">Supported wildlife</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {rec.pollinators.map(p => (
              <span key={p} className="feed-tag">{fmt(p)}</span>
            ))}
          </div>
        </div>

        {/* Ecological functions */}
        <div className="plan-section">
          <div className="plan-section-label">Ecological functions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {rec.ecologicalRoles.map(r => (
              <span key={r} className="source-tag">{fmt(r)}</span>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="plan-section">
          <div className="plan-section-label">Why this combination</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
            {explanation}
          </p>
        </div>

        {/* Footer */}
        <div className="plan-footer">
          <div className="plan-footer-sources">
            {allSources.map(s => (
              <span key={s} className="source-tag">{s}</span>
            ))}
          </div>
          <p className="plan-footer-text" style={{ marginTop: '0.75rem' }}>
            MicroHaven · Plant selection powered by deterministic matching from local plant data.
            <br />
            Not generated by AI — the matching engine is the source of truth.
          </p>
        </div>
      </div>

      <div className="plan-actions-bar">
        <button className="btn btn-secondary" onClick={onBack}>← Back to habitat</button>
        <button className="btn btn-primary" onClick={handlePrint}>Print / save plan</button>
      </div>
    </div>
  )
}
