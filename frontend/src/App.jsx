import React, { useEffect, useState, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'

import { 
  Thermometer, 
  Sun, 
  CloudRain, 
  Wind,
  Menu,
  X 
} from 'lucide-react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import { useUHIAnalysis } from './hooks/useUHIAnalysis'
import { getAIInsights, getWeatherSummary } from './services/api'

const WEATHER_TABS = [
  {
    id: 'temperature',
    icon: Sun,
    label: 'Temperature',
    getValue: (weather) => weather?.temperature,
    unit: '°C'
  },
  {
    id: 'precipitation',
    icon: CloudRain,
    label: 'Precipitation',
    getValue: (weather) => weather?.precipitation,
    unit: 'mm'
  },
  {
    id: 'airQuality',
    icon: Wind,
    label: 'Air Quality',
    getValue: (weather) => weather?.airQuality,
    unit: 'AQI'
  }
]

const formatMetric = (value, unit) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--'
  }

  const formatted = Number(value).toFixed(unit === 'AQI' ? 0 : 1)
  return unit === 'AQI' ? `${formatted} ${unit}` : `${formatted}${unit}`
}

function App() {
  const [viewState, setViewState] = useState({
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 11,
    pitch: 0,
    bearing: 0
  })
  
  const [activeLayer, setActiveLayer] = useState('lst')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [drawnPolygon, setDrawnPolygon] = useState(null)
  const [drawMode, setDrawMode] = useState(false)
  const [weatherTab, setWeatherTab] = useState('temperature')
  const [weatherSummary, setWeatherSummary] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [aiInsights, setAiInsights] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [insightError, setInsightError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState({
    name: 'New York City, USA',
    latitude: 40.7128,
    longitude: -74.006
  })
  
  const {
    analysisResult,
    isLoading,
    error,
    analyzeArea,
    runScenario,
    scenarioResult
  } = useUHIAnalysis()

  const loadWeather = useCallback(async ({ latitude, longitude }) => {
    setWeatherLoading(true)

    try {
      const summary = await getWeatherSummary({ latitude, longitude })
      setWeatherSummary(summary)
    } catch (err) {
      toast.error('Weather and air quality data could not be loaded')
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWeather({ latitude: 40.7128, longitude: -74.006 })
  }, [loadWeather])

  const handleCitySearch = useCallback(async (cityName) => {
    const result = await analyzeArea(cityName)
    if (result?.center) {
      const [longitude, latitude] = result.center

      setViewState({
        longitude,
        latitude,
        zoom: 11,
        pitch: 0,
        bearing: 0
      })

      setSelectedLocation({ name: cityName, latitude, longitude })
      setAiInsights(null)
      setInsightError(null)
      loadWeather({ latitude, longitude })
    }
  }, [analyzeArea, loadWeather])

  const generateAIInsights = useCallback(async () => {
    if (!analysisResult) return

    try {
      setLoadingInsights(true)
      setInsightError(null)

      const data = await getAIInsights({
        location: selectedLocation,
        weather: weatherSummary,
        analysis: analysisResult,
        scenario: scenarioResult
      })

      setAiInsights(data)
      toast.success('Gemini recommendations generated')
    } catch (err) {
      const message = err.response?.data?.error || err.message
      setInsightError(message)
      toast.error(`Gemini recommendations failed: ${message}`)
    } finally {
      setLoadingInsights(false)
    }
  }, [analysisResult, scenarioResult, selectedLocation, weatherSummary])

  const handleWhatIfScenario = useCallback(async (scenario, intensity) => {
    if (drawnPolygon) {
      await runScenario(drawnPolygon, scenario, intensity)
    }
  }, [drawnPolygon, runScenario])

  const handleToggleDrawMode = useCallback(() => {
    setDrawnPolygon(null)
    setDrawMode(true)
    toast('Click points on the map, then press Finish Area.')
  }, [])

  const handleDrawPolygon = useCallback((polygon) => {
    setDrawnPolygon(polygon)
    setDrawMode(false)
  }, [])

  const handleExportData = useCallback(() => {
    if (!analysisResult) return

    const payload = {
      location: selectedLocation,
      weather: weatherSummary,
      analysis: analysisResult,
      scenario: scenarioResult
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${analysisResult.city_name || 'uhi-analysis'}-data.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [analysisResult, scenarioResult, selectedLocation, weatherSummary])

  const handleGenerateReport = useCallback(() => {
    if (!analysisResult?.statistics) return

    const stats = analysisResult.statistics
    const report = [
      `Urban Heat Mapper Report`,
      `Location: ${analysisResult.city_name || selectedLocation.name}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Mean LST: ${stats.mean_lst}°C`,
      `Maximum LST: ${stats.max_lst}°C`,
      `UHI Intensity: ${stats.uhi_intensity}°C`,
      `Built-up Area: ${stats.built_up_percentage}%`,
      `Mean NDVI: ${stats.mean_ndvi}`,
      ``,
      `Current Temperature: ${formatMetric(weatherSummary?.temperature, '°C')}`,
      `Precipitation: ${formatMetric(weatherSummary?.precipitation, 'mm')}`,
      `Air Quality: ${formatMetric(weatherSummary?.airQuality, 'AQI')}`
    ].join('\n')

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${analysisResult.city_name || 'uhi-analysis'}-report.txt`
    link.click()
    URL.revokeObjectURL(url)
  }, [analysisResult, selectedLocation.name, weatherSummary])

  return (
    <div className="h-screen flex flex-col bg-dark-950">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-dark-800 text-white border border-dark-600',
          duration: 4000,
        }}
      />
      
      {/* Header */}
      <header className="glass-effect border-b border-dark-700/50 px-6 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Urban Heat Mapper</h1>
              <p className="text-xs text-dark-400">EO4SDG Initiative</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          {WEATHER_TABS.map((item) => {
            const value = item.getValue(weatherSummary)
            const active = weatherTab === item.id

            return (
            <button
              key={item.id}
              onClick={() => setWeatherTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' 
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'}`}
              title={`${item.label} for ${selectedLocation.name}`}
            >
              <item.icon className="w-4 h-4 inline mr-1" />
              {item.label}: {weatherLoading ? '...' : formatMetric(value, item.unit)}
            </button>
          )})}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-dark-400 hidden sm:inline">
            {isLoading ? 'Analyzing...' : 'Ready'}
          </span>
          <div className={`w-2 h-2 rounded-full ${
            isLoading ? 'bg-yellow-500 animate-pulse' : 
            error ? 'bg-red-500' : 'bg-green-500'
          }`} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Map View */}
        <div className="flex-1 relative">
          <MapView
            viewState={viewState}
            onViewStateChange={setViewState}
            analysisResult={analysisResult}
            activeLayer={activeLayer}
            drawnPolygon={drawnPolygon}
            onDrawPolygon={handleDrawPolygon}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            isLoading={isLoading}
          />
          
          {/* Quick Stats Overlay */}
          {analysisResult?.statistics && (
            <div className="absolute bottom-4 left-4 glass-effect rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-dark-300">UHI Intensity</span>
                  <span className="font-bold text-white">
                    {analysisResult.statistics.uhi_intensity}°C
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-dark-300">Mean LST</span>
                  <span className="font-bold text-white">
                    {analysisResult.statistics.mean_lst}°C
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-dark-300">Built-up</span>
                  <span className="font-bold text-white">
                    {analysisResult.statistics.built_up_percentage}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onCitySearch={handleCitySearch}
          isLoading={isLoading}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          analysisResult={analysisResult}
          showWhatIf={showWhatIf}
          onToggleWhatIf={() => setShowWhatIf(!showWhatIf)}
          onRunScenario={handleWhatIfScenario}
          scenarioResult={scenarioResult}
          drawnPolygon={drawnPolygon}
          onToggleDrawMode={handleToggleDrawMode}
          onExportData={handleExportData}
          onGenerateReport={handleGenerateReport}
          aiInsights={aiInsights}
          loadingInsights={loadingInsights}
          insightError={insightError}
          onGenerateAIInsights={generateAIInsights}
        />
      </main>
    </div>
  )
}

export default App
