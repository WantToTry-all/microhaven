import { useState } from 'react'
import { generateDeterministicExplanation } from '../engine/matchingEngine.js'

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LAYER_ORDER = { tall: 0, medium: 1, low: 2 }
const LAYER_ICONS = { tall: '🌲', medium: '🌿', low: '🌱' }
const LAYER_PLACEMENT = {
  tall: 'Back, against wall',
  medium: 'Middle row',
  low: 'Front, facing sun',
}

function fmt(s) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function PlantProfile({ plant, score }) {
  const [expanded, setExpanded] = useState(false)
  const bloomRange = plant.bloom_months.length > 0
    ? `${MONTHS[plant.bloom_months[0]]} – ${MONTHS[plant.bloom_months[plant.bloom_months.length - 1]]}`
    : 'Evergreen / non-flowering'

  return (
    <div className="plant-profile">
      <div className={`plant-swatch ${plant.height_layer}`}>
        {LAYER_ICONS[plant.height_layer] || '🌿'}
      </div>
      <div>
        <div className="plant-header">
          <div>
            <div className="plant-name">{plant.common_name}</div>
            <div className="plant-scientific">{plant.scientific_name}</div>
          </div>
          <div className="plant-cost">${plant.estimated_cost_usd}</div>
        </div>
        <div className="plant-bloom-line">
          {plant.bloom_months.length > 0 ? `Blooms ${bloomRange}` : 'Non-flowering — provides structure & shelter'}
        </div>
        {plant.pollinators.length > 0 && (
          <div className="plant-feeds">
            {plant.pollinators.map(p => (
              <span key={p} className="feed-tag">{fmt(p)}</span>
            ))}
          </div>
        )}
        <div className="plant-care-text">{plant.care_notes}</div>

        <button className="plant-details-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? '— Less detail' : '+ More detail'}
        </button>

        {expanded && (
          <div className="plant-details">
            <div className="detail-item">
              <span className="detail-label">Height</span>
              <span className="detail-value">{plant.mature_height_ft} ft</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Spread</span>
              <span className="detail-value">{plant.mature_width_ft} ft</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Container</span>
              <span className="detail-value">{plant.minimum_container_diameter_in}″ min</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Sun</span>
              <span className="detail-value">{plant.sun.map(fmt).join(', ')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Moisture</span>
              <span className="detail-value">{plant.moisture.map(fmt).join(', ')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Layer</span>
              <span className="detail-value">{fmt(plant.height_layer)}</span>
            </div>
            {score && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Match score</span>
                <span className="detail-value">{score}/100</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HabitatResult({ result, onViewPlan, onBack }) {
  const [showReasoning, setShowReasoning] = useState(false)

  // Error state
  if (!result.success) {
    return (
      <div className="error-state">
        <div className="error-icon">🍂</div>
        <p className="error-msg">We couldn't find a combination that fits all of those constraints.</p>
        <p className="error-hint">
          Try giving the plants a little more room, increasing the budget, or choosing a different light condition.
        </p>
        <button className="btn btn-secondary" onClick={onBack}>Adjust my space</button>
      </div>
    )
  }

  const rec = result.recommendation
  const plants = [...rec.plants].sort(
    (a, b) => (LAYER_ORDER[a.height_layer] ?? 1) - (LAYER_ORDER[b.height_layer] ?? 1)
  )
  const explanation = generateDeterministicExplanation(result)
  const allSources = [...new Set(plants.flatMap(p => p.sources || []))]

  const sunLabel = { full_sun: 'full sun', part_sun: 'part sun', shade: 'shade' }[result.constraints.sunlight] || result.constraints.sunlight
  const bloomRange = rec.bloomMonths.length > 0
    ? `${MONTHS[rec.bloomMonths[0]]}–${MONTHS[rec.bloomMonths[rec.bloomMonths.length - 1]]}`
    : '—'

  return (
    <div className="result-section">
      {/* Header */}
      <div className="result-header">
        <div className="t-eyebrow">Your MicroHaven</div>
        <h1 className="result-title">
          A {plants.length}-plant habitat for your {result.constraints.width_ft}×{result.constraints.depth_ft} ft {result.constraints.space_type}
        </h1>
        <p className="result-subtitle">
          Native to Portland and the Willamette Valley · {sunLabel} · ${rec.totalCost} estimated
        </p>
      </div>

      {/* Summary strip */}
      <div className="habitat-summary">
        <div className="summary-item">
          <span className="summary-value">{plants.length}</span>
          <span className="summary-label">Plants</span>
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

      {/* Layout diagram */}
      <div className="layout-diagram">
        <div className="layout-diagram-title">Container arrangement</div>
        <div className="layout-box">
          <div className="layout-edge-label">↑ Back · Wall side</div>
          {/* Group by layer */}
          {['tall', 'medium', 'low'].map(layer => {
            const layerPlants = plants.filter(p => p.height_layer === layer)
            if (layerPlants.length === 0) return null
            return (
              <div className="layout-row" key={layer}>
                {layerPlants.map(p => (
                  <div className="layout-item" key={p.id}>
                    <span className={`layout-item-dot ${layer}`}></span>
                    <span className="layout-item-name">{p.common_name}</span>
                    <span className="layout-item-height">{p.mature_height_ft} ft</span>
                  </div>
                ))}
              </div>
            )
          })}
          <div className="layout-edge-label">↓ Front · Sun side</div>
        </div>
      </div>

      {/* Plant profiles */}
      <div className="plant-profiles">
        <div className="plant-profiles-title">Selected plants</div>
        {plants.map(plant => {
          const s = rec.individualScores.find(s => s.id === plant.id)
          return <PlantProfile key={plant.id} plant={plant} score={s?.score} />
        })}
      </div>

      {/* Bloom timeline */}
      {plants.some(p => p.bloom_months.length > 0) && (
        <div className="bloom-section">
          <div className="bloom-title">Bloom timeline</div>
          <div className="bloom-months-header">
            <div></div>
            <div className="bloom-months-row">
              {MONTHS.slice(1).map(m => (
                <div key={m} className="bloom-month-label">{m}</div>
              ))}
            </div>
          </div>
          <div className="bloom-chart">
            {plants.map(plant => (
              <div className="bloom-row" key={plant.id}>
                <div className="bloom-row-name">{plant.common_name}</div>
                <div className="bloom-bar-track">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={i}
                      className={`bloom-bar-cell ${plant.bloom_months.includes(i + 1) ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why this works */}
      <div className="why-section">
        <h3 className="why-title">Why this habitat works</h3>
        <p className="why-text">{explanation}</p>
        {rec.reasons.length > 0 && (
          <ul className="why-reasons">
            {rec.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </div>

      {/* Data sources */}
      <div className="source-section">
        <div className="source-title">Built from local plant data</div>
        <p className="source-desc">
          Recommendations come from a curated set of Willamette Valley native plants.
          The matching system checks your space constraints before choosing a combination.
        </p>
        <div className="source-list">
          {allSources.map(s => (
            <span key={s} className="source-tag">{s}</span>
          ))}
        </div>
      </div>

      {/* Technical transparency */}
      <div className="transparency-section">
        <button
          className="transparency-toggle"
          onClick={() => setShowReasoning(!showReasoning)}
        >
          {showReasoning ? '▾' : '▸'} How this recommendation was chosen
        </button>
        {showReasoning && (
          <div className="transparency-content">
            <h4>Pipeline</h4>
            <div className="transparency-stat">{result.totalPlants} plants in database</div>
            <div className="transparency-stat">{result.rejected.length} excluded by your constraints</div>
            <div className="transparency-stat">{result.passedFilter} candidates considered</div>
            <div className="transparency-stat">{plants.length} selected for your habitat</div>

            <h4>Combination optimized for</h4>
            <div className="transparency-stat">• Sunlight and moisture compatibility</div>
            <div className="transparency-stat">• Available space and container fit</div>
            <div className="transparency-stat">• Bloom timing across the season</div>
            <div className="transparency-stat">• Ecological diversity and pollinator support</div>
            <div className="transparency-stat">• Budget fit</div>

            <h4>Excluded plants</h4>
            <ul className="transparency-rejected">
              {result.rejected.map(r => (
                <li key={r.id}>
                  <span className="rejected-name-text">{r.name}</span>
                  {r.reasons.map((reason, i) => (
                    <span key={i} className="rejected-reason-text">{reason}</span>
                  ))}
                </li>
              ))}
            </ul>

            <h4>Individual match scores</h4>
            {result.individualScores.slice(0, 8).map(s => (
              <div key={s.id} className="score-row">
                <span>{s.name}</span>
                <span className="score-val">{s.score}</span>
              </div>
            ))}

            <h4>Combination score breakdown</h4>
            {rec.combinationBreakdown && Object.entries(rec.combinationBreakdown).map(([key, val]) => (
              <div key={key} className="score-row">
                <span>{key.replace(/_/g, ' ')}</span>
                <span className="score-val">{val}</span>
              </div>
            ))}
            <div className="score-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: '600' }}>
              <span>Final score</span>
              <span className="score-val">{rec.finalScore}</span>
            </div>

            {result.alternativeCombinations?.length > 0 && (
              <>
                <h4>Alternative combinations</h4>
                {result.alternativeCombinations.map((alt, i) => (
                  <div key={i} className="score-row">
                    <span>{alt.plants.join(' + ')}</span>
                    <span style={{ color: 'var(--ink-tertiary)' }}>{alt.finalScore} · ${alt.totalCost}</span>
                  </div>
                ))}
              </>
            )}

            <h4 style={{ marginTop: '1rem' }}>How it works</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-tertiary)', lineHeight: '1.6' }}>
              The recommendation is generated from structured plant data and deterministic matching rules.
              No AI model selects the plants — the system uses hard-constraint filtering followed by
              weighted scoring of individual plants and habitat combinations. AI is used only to explain
              the resulting habitat in plain language, and is entirely optional.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="result-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Adjust space</button>
        <button className="btn btn-primary btn-large" onClick={onViewPlan} style={{ marginLeft: 'auto' }}>
          View my plan →
        </button>
      </div>
    </div>
  )
}
