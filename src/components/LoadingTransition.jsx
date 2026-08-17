import { useState, useEffect } from 'react'

const STEPS = [
  'Reading your space',
  'Checking local plants',
  'Matching sunlight and moisture',
  'Balancing bloom periods',
  'Designing your habitat',
]

export default function LoadingTransition() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="transition-container">
      <div className="transition-icon">
        <div className="transition-spinner"></div>
      </div>
      <div className="transition-steps">
        {STEPS.map((text, i) => (
          <div
            key={i}
            className={`transition-step ${i < step ? 'done' : i === step ? 'active' : ''}`}
          >
            <span className="transition-step-icon">
              {i < step ? '✓' : i === step ? '→' : '·'}
            </span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
