import React, { useState } from 'react'
import { 
  Download, 
  FileText, 
  Lightbulb,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import KPICards from './KPICards'
import LayerControls from './LayerControls'
import WhatIfPanel from './WhatIfPanel'
import SearchBar from './SearchBar'

function Sidebar({ 
  isOpen, 
  onClose,
  onCitySearch, 
  isLoading,
  activeLayer,
  onLayerChange,
  analysisResult,
  showWhatIf,
  onToggleWhatIf,
  onRunScenario,
  scenarioResult,
  drawnPolygon,
  onToggleDrawMode,
  onExportData,
  onGenerateReport,
  aiInsights,
  loadingInsights,
  insightError,
  onGenerateAIInsights
}) {
  const insight = aiInsights?.insight
  const model = aiInsights?.model

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        fixed lg:relative right-0 top-0 lg:top-auto
        w-full max-w-md lg:w-96 xl:w-[420px]
        h-full lg:h-auto
        bg-dark-900/95 backdrop-blur-xl border-l border-dark-700/50
        transition-transform duration-300 ease-in-out
        z-50 overflow-y-auto
        flex flex-col
      `}>
        {/* Sidebar header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">Analysis Panel</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Sidebar content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Search */}
          <SearchBar onSearch={onCitySearch} isLoading={isLoading} />
          
          {/* Layer Controls */}
          {analysisResult && (
            <LayerControls
              activeLayer={activeLayer}
              onLayerChange={onLayerChange}
            />
          )}
          
          {/* KPI Cards */}
          {analysisResult?.statistics && (
            <KPICards data={analysisResult.statistics} />
          )}

          {analysisResult && (
            <section className="card p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="font-medium">Gemini Recommendations</h3>
                    <p className="text-xs text-dark-400">
                      {model || 'Planning insights from dashboard metrics'}
                    </p>
                  </div>
                </div>
                {insight?.risk_level && (
                  <span className="shrink-0 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-300">
                    {insight.risk_level}
                  </span>
                )}
              </div>

              <button
                onClick={onGenerateAIInsights}
                disabled={loadingInsights}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loadingInsights ? 'animate-spin' : ''}`} />
                {loadingInsights ? 'Generating...' : insight ? 'Refresh Recommendations' : 'Generate Recommendations'}
              </button>

              {insightError && (
                <div className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{insightError}</span>
                </div>
              )}

              {insight && (
                <div className="space-y-4">
                  {insight.summary && (
                    <p className="text-sm leading-6 text-dark-200">{insight.summary}</p>
                  )}

                  {Array.isArray(insight.recommendations) && (
                    <div>
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-dark-400">
                        Recommended Actions
                      </h4>
                      <ul className="space-y-2">
                        {insight.recommendations.map((item, index) => (
                          <li key={`${item}-${index}`} className="flex gap-2 text-sm text-dark-200">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(insight.priority_zones) && (
                    <div>
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-dark-400">
                        Priority Zones
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insight.priority_zones.map((zone, index) => (
                          <span
                            key={`${zone}-${index}`}
                            className="rounded-md bg-dark-800 px-2 py-1 text-xs text-dark-200"
                          >
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.confidence_note && (
                    <p className="border-t border-dark-700 pt-3 text-xs leading-5 text-dark-400">
                      {insight.confidence_note}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
          
          {/* What-If Panel Toggle */}
          {analysisResult && (
            <div>
              <button
                onClick={onToggleWhatIf}
                className="w-full flex items-center justify-between p-4 card-hover group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">Scenario Modeler</h3>
                    <p className="text-xs text-dark-400">Predict cooling interventions</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-dark-400 transition-transform ${
                  showWhatIf ? 'rotate-90' : ''
                }`} />
              </button>
              
              {showWhatIf && (
                <WhatIfPanel
                  onRunScenario={onRunScenario}
                  scenarioResult={scenarioResult}
                  hasPolygon={!!drawnPolygon}
                  onToggleDrawMode={onToggleDrawMode}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Export section */}
        {analysisResult && (
          <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/50 p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportData}
                className="btn-secondary flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button
                onClick={onGenerateReport}
                className="btn-primary flex items-center justify-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4" />
                Report
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar
