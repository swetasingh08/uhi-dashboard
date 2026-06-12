import React, { useEffect, useMemo, useState } from 'react'
import DeckGL from '@deck.gl/react'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer, GeoJsonLayer } from '@deck.gl/layers'
import { Map } from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import LoadingSpinner from './LoadingSpinner'

const MAP_STYLE = {
  version: 8,
  sources: {
    'dark-matter': {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      attribution: '© <a href="https://carto.com/">CARTO</a>'
    }
  },
  layers: [{
    id: 'dark-matter',
    type: 'raster',
    source: 'dark-matter',
    minzoom: 0,
    maxzoom: 19
  }]
}

function MapView({ 
  viewState, 
  onViewStateChange, 
  analysisResult, 
  activeLayer,
  drawnPolygon,
  onDrawPolygon,
  drawMode,
  onDrawModeChange,
  isLoading 
}) {
  const [draftPoints, setDraftPoints] = useState([])

  useEffect(() => {
    if (drawMode) {
      setDraftPoints([])
    }
  }, [drawMode])

  const finishDrawing = () => {
    if (draftPoints.length < 3) return

    onDrawPolygon({
      type: 'Polygon',
      coordinates: [[...draftPoints, draftPoints[0]]]
    })
    onDrawModeChange(false)
  }

  const cancelDrawing = () => {
    setDraftPoints([])
    onDrawModeChange(false)
  }

  const layers = useMemo(() => {
    const layerList = []
    
    if (analysisResult?.layers) {
      // Active analysis layer
      const activeLayerData = analysisResult.layers[activeLayer]
      if (activeLayerData?.tile_url) {
        layerList.push(
          new TileLayer({
            id: `analysis-${activeLayer}`,
            data: activeLayerData.tile_url,
            opacity: 0.85,
            renderSubLayers: (props) => {
              const { boundingBox } = props.tile
              return new BitmapLayer(props, {
                data: null,
                image: props.data,
                bounds: [
                  boundingBox[0][0],
                  boundingBox[0][1],
                  boundingBox[1][0],
                  boundingBox[1][1]
                ]
              })
            }
          })
        )
      }
      
      // Hotspot overlay
      if (activeLayer === 'lst' && analysisResult.layers.hotspots?.tile_url) {
        layerList.push(
          new TileLayer({
            id: 'hotspots',
            data: analysisResult.layers.hotspots.tile_url,
            opacity: 0.4,
            renderSubLayers: (props) => {
              const { boundingBox } = props.tile
              return new BitmapLayer(props, {
                data: null,
                image: props.data,
                bounds: [
                  boundingBox[0][0],
                  boundingBox[0][1],
                  boundingBox[1][0],
                  boundingBox[1][1]
                ]
              })
            }
          })
        )
      }
    }
    
    // Drawn polygon
    if (drawnPolygon) {
      layerList.push(
        new GeoJsonLayer({
          id: 'drawn-area',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: drawnPolygon
            }]
          },
          filled: true,
          getFillColor: [6, 182, 212, 40],
          getLineColor: [6, 182, 212],
          lineWidthMinPixels: 2,
          lineDashJustified: true,
          dashJustified: true
        })
      )
    }

    if (drawMode && draftPoints.length > 0) {
      const features = []

      if (draftPoints.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[...draftPoints, draftPoints[0]]]
          }
        })
      } else {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: draftPoints
          }
        })
      }

      layerList.push(
        new GeoJsonLayer({
          id: 'draft-drawn-area',
          data: {
            type: 'FeatureCollection',
            features
          },
          filled: true,
          stroked: true,
          pointType: 'circle',
          getFillColor: [6, 182, 212, 35],
          getLineColor: [6, 182, 212, 230],
          getPointRadius: 80,
          getPointRadiusMinPixels: 5,
          getPointRadiusMaxPixels: 8,
          lineWidthMinPixels: 2
        })
      )
    }
    
    return layerList
  }, [analysisResult, activeLayer, drawnPolygon, drawMode, draftPoints])

  return (
    <div className="w-full h-full relative">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => onViewStateChange(viewState)}
        controller={{
          doubleClickZoom: true,
          touchRotate: true,
          keyboard: true
        }}
        layers={layers}
        onClick={(info) => {
          if (!drawMode || !info.coordinate) return
          setDraftPoints((points) => [...points, info.coordinate])
        }}
        getCursor={() => drawMode ? 'crosshair' : 'grab'}
      >
        <Map
          mapStyle={MAP_STYLE}
          mapLib={maplibregl}
          styleDiffing={true}
          reuseMaps
        />
      </DeckGL>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-dark-950/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card p-8 text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-dark-300">Analyzing urban heat patterns...</p>
            <p className="text-xs text-dark-500">Processing satellite imagery via Google Earth Engine</p>
          </div>
        </div>
      )}

      {drawMode && !isLoading && (
        <div className="absolute top-4 left-4 glass-effect rounded-xl px-4 py-3 text-sm text-dark-200 space-y-3">
          <p>Click map points to outline an intervention area.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={finishDrawing}
              disabled={draftPoints.length < 3}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              Finish Area
            </button>
            <button
              onClick={cancelDrawing}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Layer legend */}
      {analysisResult?.layers?.[activeLayer] && (
        <div className="absolute bottom-4 right-4 glass-effect rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-32 h-3 bg-gradient-heat rounded" />
            <div className="flex justify-between text-xs text-dark-400">
              <span>{analysisResult.layers[activeLayer].min || 0}</span>
              <span className="mx-2">{activeLayer === 'lst' ? '°C' : ''}</span>
              <span>{analysisResult.layers[activeLayer].max || 100}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView
