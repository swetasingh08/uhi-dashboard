import React from 'react'
import { 
  Thermometer, 
  TrendingUp, 
  MapPin, 
  Trees,
  Building2,
  AlertTriangle 
} from 'lucide-react'

const METRICS = [
  {
    key: 'uhi_intensity',
    label: 'UHI Intensity',
    icon: Thermometer,
    unit: '°C',
    color: 'from-red-500 to-orange-500',
    description: 'Temperature difference'
  },
  {
    key: 'mean_lst',
    label: 'Mean LST',
    icon: TrendingUp,
    unit: '°C',
    color: 'from-orange-500 to-yellow-500',
    description: 'Average surface temp'
  },
  {
    key: 'max_lst',
    label: 'Maximum LST',
    icon: AlertTriangle,
    unit: '°C',
    color: 'from-pink-500 to-red-500',
    description: 'Peak temperature'
  },
  {
    key: 'mean_ndvi',
    label: 'Mean NDVI',
    icon: Trees,
    unit: '',
    color: 'from-green-500 to-emerald-500',
    description: 'Vegetation index'
  },
  {
    key: 'built_up_percentage',
    label: 'Built-up Area',
    icon: Building2,
    unit: '%',
    color: 'from-blue-500 to-cyan-500',
    description: 'Urban density'
  },
  {
    key: 'total_area_km2',
    label: 'Study Area',
    icon: MapPin,
    unit: 'km²',
    color: 'from-purple-500 to-pink-500',
    description: 'Analysis extent'
  }
]

function KPICards({ data }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-dark-300 uppercase tracking-wider mb-3">
        Key Metrics
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {METRICS.map((metric) => {
          const value = data[metric.key]
          if (value === undefined || value === null) return null
          
          return (
            <div
              key={metric.key}
              className="card p-3 hover:scale-[1.02] transition-transform cursor-default group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} 
                  flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <metric.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </span>
                  {metric.unit && (
                    <span className="text-xs text-dark-400">{metric.unit}</span>
                  )}
                </div>
                <p className="text-xs text-dark-500">{metric.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default KPICards