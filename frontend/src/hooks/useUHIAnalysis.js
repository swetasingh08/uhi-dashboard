import { useState, useCallback } from 'react'
import { analyzeUHI, runWhatIfScenario, geocodeCity } from '../services/api'
import toast from 'react-hot-toast'

export function useUHIAnalysis() {
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scenarioResult, setScenarioResult] = useState(null)

  const analyzeArea = useCallback(async (cityName) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First, geocode the city
      const geocoded = await geocodeCity(cityName)
      
      // Run UHI analysis
      const result = await analyzeUHI({
        geometry: geocoded.geometry,
        city_name: cityName,
        date_range: {
          start: '2023-06-01',
          end: '2023-08-31'
        }
      })
      
      setAnalysisResult(result)
      toast.success(`Analysis complete for ${cityName}`)
      
      return {
        center: geocoded.center,
        result
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message
      setError(message)
      toast.error(`Analysis failed: ${message}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const runScenario = useCallback(async (areaGeometry, scenario, intensity) => {
    try {
      const result = await runWhatIfScenario({
        area_geometry: areaGeometry,
        scenario,
        intensity
      })
      
      setScenarioResult(result)
      toast.success('Scenario analysis complete')
      return result
    } catch (err) {
      toast.error('Scenario analysis failed')
      return null
    }
  }, [])

  return {
    analysisResult,
    isLoading,
    error,
    analyzeArea,
    runScenario,
    scenarioResult
  }
}