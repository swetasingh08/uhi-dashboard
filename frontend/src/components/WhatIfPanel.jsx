import React, { useState } from 'react'
import { 
  TreePine, 
  Building2, 
  Trees,
  Sliders,
  Play,
  Target,
  Zap
} from 'lucide-react'

const SCENARIOS = [
  {
    id: 'increase_vegetation',
    label: 'Increase Vegetation',
    icon: TreePine,
    description: 'Add green spaces and parks',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  {
    id: 'cool_roofs',
    label: 'Cool Roofs',
    icon: Building2,
    description: 'High-albedo roofing materials',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  {
    id: 'urban_forestry',
    label: 'Urban Forestry',
    icon: Trees,
    description: 'Street trees and canopy cover',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20'
  }
]

function WhatIfPanel({ 
  onRunScenario, 
  scenarioResult, 
  hasPolygon,
  onToggleDrawMode 
}) {
  const [selectedScenario, setSelectedScenario] = useState('increase_vegetation')
  const [intensity, setIntensity] = useState(0.5)

  const handleRun = () => {
    onRunScenario(selectedScenario, intensity)
  }

  return (
    <div className="mt-3 p-4 card space-y-4 animate-in slide-in-from-top-2">
      <h4 className="font-medium text-purple-400 flex items-center gap-2">
        <Target className="w-4 h-4" />
        What-If Scenario Modeler
      </h4>
      
      {/* Area selection */}
      <div>
        <label className="text-xs text-dark-400 block mb-2">Select Area</label>
        <button
          onClick={onToggleDrawMode}
          className={`w-full p-3 rounded-xl border-2 border-dashed transition-all ${
            hasPolygon
              ? 'border-cyan-500/50 bg-cyan-500/10'
              : 'border-dark-600 hover:border-dark-400'
          }`}
        >
          {hasPolygon ? (
            <span className="text-sm text-cyan-400 flex items-center gap-2 justify-center">
              <Target className="w-4 h-4" />
              Area selected - Click to redraw
            </span>
          ) : (
            <span className="text-sm text-dark-400">
              Click map to draw area
            </span>
          )}
        </button>
      </div>
      
      {/* Scenario selection */}
      <div>
        <label className="text-xs text-dark-400 block mb-2">Intervention Type</label>
        <div className="space-y-1.5">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                selectedScenario === scenario.id
                  ? 'bg-purple-600/20 border border-purple-500/30'
                  : 'hover:bg-dark-700 border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 ${scenario.bgColor} rounded-lg flex items-center justify-center`}>
                <scenario.icon className={`w-4 h-4 ${scenario.color}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{scenario.label}</p>
                <p className="text-xs text-dark-400">{scenario.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Intensity slider */}
      <div>
        <label className="text-xs text-dark-400 flex items-center gap-2 mb-2">
          <Sliders className="w-3 h-3" />
          Intervention Intensity
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer
              accent-purple-500
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-purple-500
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <div className="flex justify-between text-xs text-dark-500">
            <span>Low ({Math.round(intensity * 100)}%)</span>
            <span>High</span>
          </div>
        </div>
      </div>
      
      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!hasPolygon}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        <Play className="w-4 h-4" />
        Run Scenario Analysis
      </button>
      
      {/* Results */}
      {scenarioResult && (
        <div className="p-4 bg-dark-800 rounded-xl border border-dark-700 space-y-3 animate-in fade-in">
          <h5 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Predicted Impact
          </h5>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Temperature Reduction</span>
              <span className="font-bold text-green-400">
                -{scenarioResult.predicted_lst_reduction}°C
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">New Average LST</span>
              <span className="font-bold text-white">
                {scenarioResult.predicted_new_lst}°C
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Cooling Benefit</span>
              <span className="font-bold text-cyan-400">
                {scenarioResult.cooling_benefit_percentage}%
              </span>
            </div>
            
            {scenarioResult.equivalent_trees && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Equivalent Trees</span>
                <span className="font-bold text-emerald-400">
                  ~{scenarioResult.equivalent_trees}
                </span>
              </div>
            )}
            
            <div className="pt-2 border-t border-dark-700">
              <div className="flex justify-between text-xs">
                <span className="text-dark-500">Model Confidence</span>
                <span className="text-dark-400">
                  {Math.round(scenarioResult.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatIfPanel
