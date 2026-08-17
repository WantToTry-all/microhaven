import { useState } from 'react'

const DEMO_VALUES = {
  space_type: 'balcony',
  width_ft: '6',
  depth_ft: '4',
  sunlight: 'part_sun',
  moisture: 'moderate',
  watering: 'moderate',
  experience: 'beginner',
  budget: '40',
}

const INITIAL_VALUES = {
  space_type: '',
  width_ft: '',
  depth_ft: '',
  sunlight: '',
  moisture: '',
  watering: 'moderate',
  experience: 'beginner',
  budget: '',
}

export default function SpaceForm({ onSubmit }) {
  const [form, setForm] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const loadDemo = () => {
    setForm(DEMO_VALUES)
    setErrors({})
  }

  const validate = () => {
    const e = {}
    if (!form.space_type) e.space_type = 'Choose a space type'
    if (!form.width_ft || Number(form.width_ft) <= 0) e.width_ft = 'Enter width'
    if (!form.depth_ft || Number(form.depth_ft) <= 0) e.depth_ft = 'Enter depth'
    if (!form.sunlight) e.sunlight = 'Choose sunlight level'
    if (!form.moisture) e.moisture = 'Choose moisture level'
    if (!form.budget || Number(form.budget) <= 0) e.budget = 'Enter budget'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit(form)
  }

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        {/* CSS Balcony Scene */}
        <div className="hero-scene">
          <div className="scene-bee" style={{ right: '25%' }}>🐝</div>

          <div className="scene-pot scene-pot-1">
            <div className="scene-plant">
              <div className="scene-stem pot1-stem" style={{ position: 'relative' }}>
                <div className="scene-leaf pot1-leaf1"></div>
                <div className="scene-leaf pot1-leaf2"></div>
                <div className="scene-flower pot1-flower"></div>
              </div>
            </div>
          </div>

          <div className="scene-pot scene-pot-2">
            <div className="scene-plant">
              <div className="scene-stem pot2-stem" style={{ position: 'relative' }}>
                <div className="scene-leaf pot2-leaf1"></div>
                <div className="scene-leaf pot2-leaf2"></div>
                <div className="scene-leaf pot2-leaf3"></div>
                <div className="scene-flower pot2-flower"></div>
              </div>
            </div>
          </div>

          <div className="scene-pot scene-pot-3">
            <div className="scene-plant">
              <div className="scene-stem pot3-stem" style={{ position: 'relative' }}>
                <div className="scene-leaf pot3-leaf1"></div>
                <div className="scene-leaf pot3-leaf2"></div>
              </div>
            </div>
          </div>

          <div className="scene-rail"></div>
          <div className="scene-balcony"></div>
        </div>

        <h1 className="hero-tagline">
          Small space.<br /><em>Real habitat.</em>
        </h1>
        <p className="hero-desc">
          Turn a balcony, patio, or windowsill into a tiny native habitat
          designed around the conditions you actually have.
        </p>
        <div className="hero-actions">
          <a href="#space-form" className="btn btn-primary btn-large">Build my MicroHaven</a>
          <button className="btn-demo" onClick={loadDemo}>See an example</button>
        </div>
      </div>

      {/* Form */}
      <form id="space-form" onSubmit={handleSubmit}>

        {/* Space Type */}
        <div className="form-section">
          <div className="section-label">01</div>
          <h2 className="section-title">What kind of space?</h2>
          <p className="section-desc">Even the smallest corner can support native life.</p>
          <div className="option-grid option-grid-3">
            {[
              { value: 'balcony', icon: '🏢', label: 'Balcony', hint: 'Apartment or condo' },
              { value: 'patio', icon: '🏡', label: 'Patio', hint: 'Ground level, enclosed' },
              { value: 'windowsill', icon: '🪟', label: 'Windowsill', hint: 'Indoor or ledge' },
            ].map(opt => (
              <div
                key={opt.value}
                className={`option-tile ${form.space_type === opt.value ? 'selected' : ''}`}
                onClick={() => set('space_type', opt.value)}
              >
                <span className="option-tile-icon">{opt.icon}</span>
                <span className="option-tile-label">{opt.label}</span>
                <span className="option-tile-hint">{opt.hint}</span>
              </div>
            ))}
          </div>
          {errors.space_type && <div className="field-error" style={{ marginTop: '0.5rem' }}>{errors.space_type}</div>}
        </div>

        {/* Dimensions */}
        <div className="form-section">
          <div className="section-label">02</div>
          <h2 className="section-title">How large is the space?</h2>
          <p className="section-desc">Approximate is fine. We'll work with what you have.</p>
          <div className="inline-inputs">
            <div className="field">
              <label className="field-label">Width</label>
              <div className="field-row">
                <input
                  type="number"
                  className="field-input"
                  value={form.width_ft}
                  onChange={e => set('width_ft', e.target.value)}
                  placeholder="6"
                  min="1"
                  max="30"
                  step="0.5"
                />
                <span className="field-unit">ft</span>
              </div>
              {errors.width_ft && <div className="field-error">{errors.width_ft}</div>}
            </div>
            <div className="field">
              <label className="field-label">Depth</label>
              <div className="field-row">
                <input
                  type="number"
                  className="field-input"
                  value={form.depth_ft}
                  onChange={e => set('depth_ft', e.target.value)}
                  placeholder="4"
                  min="1"
                  max="30"
                  step="0.5"
                />
                <span className="field-unit">ft</span>
              </div>
              {errors.depth_ft && <div className="field-error">{errors.depth_ft}</div>}
            </div>
          </div>
        </div>

        {/* Sunlight */}
        <div className="form-section">
          <div className="section-label">03</div>
          <h2 className="section-title">How much direct sun does it get?</h2>
          <p className="section-desc">Think about the brightest part of the day.</p>
          <div className="option-grid option-grid-3">
            {[
              { value: 'full_sun', icon: '☀️', label: 'Full sun', hint: '6+ hours direct' },
              { value: 'part_sun', icon: '⛅', label: 'Part sun', hint: '3–6 hours direct' },
              { value: 'shade', icon: '🌥', label: 'Mostly shade', hint: 'Under 3 hours' },
            ].map(opt => (
              <div
                key={opt.value}
                className={`option-tile ${form.sunlight === opt.value ? 'selected' : ''}`}
                onClick={() => set('sunlight', opt.value)}
              >
                <span className="option-tile-icon">{opt.icon}</span>
                <span className="option-tile-label">{opt.label}</span>
                <span className="option-tile-hint">{opt.hint}</span>
              </div>
            ))}
          </div>
          {errors.sunlight && <div className="field-error" style={{ marginTop: '0.5rem' }}>{errors.sunlight}</div>}
        </div>

        {/* Moisture */}
        <div className="form-section">
          <div className="section-label">04</div>
          <h2 className="section-title">How does the space usually feel?</h2>
          <p className="section-desc">This helps match plants to your natural conditions.</p>
          <div className="option-grid option-grid-3">
            {[
              { value: 'dry', icon: '🏜', label: 'Mostly dry', hint: 'Drains quickly' },
              { value: 'moderate', icon: '💧', label: 'Moderate', hint: 'Average moisture' },
              { value: 'wet', icon: '🌧', label: 'Often damp', hint: 'Stays moist' },
            ].map(opt => (
              <div
                key={opt.value}
                className={`option-tile ${form.moisture === opt.value ? 'selected' : ''}`}
                onClick={() => set('moisture', opt.value)}
              >
                <span className="option-tile-icon">{opt.icon}</span>
                <span className="option-tile-label">{opt.label}</span>
                <span className="option-tile-hint">{opt.hint}</span>
              </div>
            ))}
          </div>
          {errors.moisture && <div className="field-error" style={{ marginTop: '0.5rem' }}>{errors.moisture}</div>}
        </div>

        {/* Experience & Budget */}
        <div className="form-section">
          <div className="section-label">05</div>
          <h2 className="section-title">A little about you</h2>
          <p className="section-desc">No experience needed. Start small — you can always add another pot later.</p>
          <div className="inline-inputs" style={{ marginBottom: '1rem' }}>
            <div className="field">
              <label className="field-label">Gardening experience</label>
              <div className="option-grid option-grid-2">
                {[
                  { value: 'beginner', label: 'Beginner', hint: 'New to this' },
                  { value: 'intermediate', label: 'Some experience', hint: 'I\'ve kept plants alive' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    className={`option-tile ${form.experience === opt.value ? 'selected' : ''}`}
                    onClick={() => set('experience', opt.value)}
                    style={{ padding: '0.75rem' }}
                  >
                    <span className="option-tile-label">{opt.label}</span>
                    <span className="option-tile-hint">{opt.hint}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label">Plant budget</label>
              <div className="field-row">
                <span className="field-unit">$</span>
                <input
                  type="number"
                  className="field-input"
                  value={form.budget}
                  onChange={e => set('budget', e.target.value)}
                  placeholder="40"
                  min="5"
                  step="5"
                />
              </div>
              {errors.budget && <div className="field-error">{errors.budget}</div>}
              <span className="field-hint">For plants only — containers & soil separate</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ padding: '1rem 0 4rem' }}>
          <button type="submit" className="btn btn-primary btn-large btn-block">
            Build my MicroHaven
          </button>
          <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
            No yard required. Designed for balconies, patios, and other places where a full garden isn't possible.
          </p>
        </div>
      </form>
    </div>
  )
}
