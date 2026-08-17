import { useState, useCallback } from 'react'
import SpaceForm from './components/SpaceForm.jsx'
import HabitatResult from './components/HabitatResult.jsx'
import PlanView from './components/PlanView.jsx'
import LoadingTransition from './components/LoadingTransition.jsx'
import { runMatchingPipeline } from './engine/matchingEngine.js'

const STEPS = ['Your Space', 'Your Habitat', 'Your Plan']

export default function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = useCallback((formData) => {
    setLoading(true)
    setCurrentStep(1)

    // Brief transition to show the pipeline steps
    setTimeout(() => {
      try {
        const matchResult = runMatchingPipeline(formData)
        setResult(matchResult)
      } catch (err) {
        console.error('Matching error:', err)
        setResult({
          success: false,
          message: "Something went wrong while finding your habitat. Please try again.",
        })
      }
      setLoading(false)
    }, 2400)
  }, [])

  const handleViewPlan = () => setCurrentStep(2)
  const handleBackToHabitat = () => setCurrentStep(1)
  const handleBackToForm = () => {
    setCurrentStep(0)
    setLoading(false)
  }
  const handleStartOver = () => {
    setCurrentStep(0)
    setLoading(false)
    setResult(null)
  }

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="nav-logo" onClick={handleStartOver} style={{ cursor: 'pointer' }}>
            MicroHaven
          </span>
          <span className="nav-region">Portland, OR</span>
        </div>
      </nav>

      {/* Step indicator */}
      <div className="app-content">
        <div className="step-indicator">
          {STEPS.map((step, i) => (
            <span key={step} style={{ display: 'contents' }}>
              {i > 0 && <div className={`step-line ${i <= currentStep ? 'active' : ''}`} />}
              <div className={`step-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}>
                <span className="step-number">
                  {i < currentStep ? '✓' : i + 1}
                </span>
                <span>{step}</span>
              </div>
            </span>
          ))}
        </div>
      </div>

      <main className="app-content">
        {currentStep === 0 && (
          <SpaceForm onSubmit={handleSubmit} />
        )}

        {currentStep === 1 && loading && (
          <LoadingTransition />
        )}

        {currentStep === 1 && !loading && result && (
          <HabitatResult
            result={result}
            onViewPlan={handleViewPlan}
            onBack={handleBackToForm}
          />
        )}

        {currentStep === 2 && result?.success && (
          <PlanView
            result={result}
            onBack={handleBackToHabitat}
          />
        )}
      </main>
    </div>
  )
}
