import React from 'react'
import { Layers, Thermometer, Leaf, Building2, Snowflake, AlertTriangle } from 'lucide-react'

const LAYERS = [
  {
    id: 'lst',
    label: 'Land Surface Temperature',
    icon: Thermometer,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    description: 'Surface temperature in °C'
  },
  {
    id: 'ndvi',
    label: 'Vegetation Index (NDVI)',
    icon: Leaf,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Vegetation health and density'
  },
  {
    id: 'lulc',
    label: 'Land Use / Land Cover',
    icon: Building2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Urban, water, vegetation classes'
  },
  {
    id: 'cooling',
    label: 'Cooling Potential',
    icon: Snowflake,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    description: 'Where greening helps most'
  }
]

function LayerControls({ activeLayer, onLayerChange }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-medium text-dark-300 uppercase tracking-wider">
          Map Layers
        </h3>
      </div>
      
      <div className="space-y-1.5">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              activeLayer === layer.id
                ? 'bg-primary-600/10 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                : 'hover:bg-dark-800 border border-transparent'
            }`}
          >
            <div className={`w-10 h-10 ${layer.bgColor} rounded-lg flex items-center justify-center`}>
              <layer.icon className={`w-5 h-5 ${layer.color}`} />
            </div>
            <div className="text-left flex-1">
              <p className={`text-sm font-medium ${
                activeLayer === layer.id ? 'text-white' : 'text-dark-200'
              }`}>
                {layer.label}
              </p>
              <p className="text-xs text-dark-400">{layer.description}</p>
            </div>
            {activeLayer === layer.id && (
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default LayerControls