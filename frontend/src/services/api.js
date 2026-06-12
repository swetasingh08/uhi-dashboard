import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for Earth Engine analysis
  headers: {
    'Content-Type': 'application/json'
  }
})

const createBoundingBoxPolygon = (bbox) => {
  const [south, north, west, east] = bbox
  const minSize = 0.08
  const latPadding = Math.max((north - south) * 0.05, minSize / 2)
  const lonPadding = Math.max((east - west) * 0.05, minSize / 2)

  return {
    type: 'Polygon',
    coordinates: [[
      [west - lonPadding, south - latPadding],
      [east + lonPadding, south - latPadding],
      [east + lonPadding, north + latPadding],
      [west - lonPadding, north + latPadding],
      [west - lonPadding, south - latPadding]
    ]]
  }
}

const getPolygonGeometry = (result, bbox) => {
  const geometry = result.geojson

  if (geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon') {
    return geometry
  }

  return createBoundingBoxPolygon(bbox)
}

export const analyzeUHI = async (params) => {
  const response = await api.post('/analyze', params)
  return response.data
}

export const runWhatIfScenario = async (params) => {
  const response = await api.post('/what-if', params)
  return response.data
}

export const getAIInsights = async (params) => {
  const response = await api.post('/ai-insights', params)
  return response.data
}

export const getWeatherSummary = async ({ latitude, longitude }) => {
  const [forecastResponse, airQualityResponse] = await Promise.all([
    axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,precipitation,wind_speed_10m',
        timezone: 'auto'
      }
    }),
    axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
      params: {
        latitude,
        longitude,
        current: 'us_aqi,pm2_5,pm10',
        timezone: 'auto'
      }
    })
  ])

  const currentWeather = forecastResponse.data?.current || {}
  const currentAirQuality = airQualityResponse.data?.current || {}

  return {
    temperature: currentWeather.temperature_2m ?? null,
    precipitation: currentWeather.precipitation ?? null,
    windSpeed: currentWeather.wind_speed_10m ?? null,
    airQuality: currentAirQuality.us_aqi ?? null,
    pm25: currentAirQuality.pm2_5 ?? null,
    pm10: currentAirQuality.pm10 ?? null,
    updatedAt: currentWeather.time || currentAirQuality.time || null
  }
}

export const geocodeCity = async (cityName) => {
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search`,
    {
      params: {
        q: cityName,
        format: 'json',
        limit: 1,
        polygon_geojson: 1
      },
      headers: {
        'User-Agent': 'UHIMapper/1.0'
      }
    }
  )

  if (!response.data || response.data.length === 0) {
    throw new Error('City not found')
  }

  const result = response.data[0]
  
  // Calculate center from bounding box
  const bbox = result.boundingbox.map(Number)
  const center = [
    (bbox[2] + bbox[3]) / 2, // longitude
    (bbox[0] + bbox[1]) / 2  // latitude
  ]

  const geometry = getPolygonGeometry(result, bbox)

  return {
    geometry,
    center,
    displayName: result.display_name,
    boundingBox: bbox
  }
}
