from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import ee
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from dotenv import load_dotenv
import hashlib
import io
from gee_service import UHIAnalyzer
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes under /api/ from any origin
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/', methods=['GET'])
def home():
    """Root endpoint to prevent 404 errors on home page load"""
    return jsonify({
        'message': 'Welcome to the UHI Dashboard API Backend!',
        'documentation': 'Please use the /api/ routes to fetch data.',
        'status': 'online'
    }), 200

# Initialize Earth Engine Safely for Cloud Deployment
ee_initialized = False
try:
    service_account = os.environ.get('GEE_SERVICE_ACCOUNT')
    key_path = os.environ.get('GEE_PRIVATE_KEY_PATH', '/etc/secrets/gee-key.json')
    
    if service_account and key_path and os.path.exists(key_path):
        logger.info(f"Attempting GEE initialization with key file at: {key_path}")
        credentials = ee.ServiceAccountCredentials(service_account, key_path)
        ee.Initialize(credentials)
        ee_initialized = True
        logger.info("Earth Engine successfully initialized with service account.")
    else:
        project_id = os.environ.get('GEE_PROJECT_ID', 'uhi-dashboard-497915')
        logger.warning(f"Key file missing or unreadable at '{key_path}'. Trying project id fallback: {project_id}")
        ee.Initialize(project=project_id)
        ee_initialized = True
        logger.info("Earth Engine initialized with project credentials fallback.")
except Exception as e:
    logger.error(f"CRITICAL: Failed to initialize Earth Engine core: {e}")
    logger.warning("Backend will run with degraded capabilities. Earth Engine analytics are disabled until resolved.")

# Initialize UHI Analyzer
uhi_analyzer = UHIAnalyzer()

# In-memory cache (use Redis in production)
analysis_cache = {}

def get_geometry_type(geometry):
    if geometry.get('type') == 'Feature':
        return geometry.get('geometry', {}).get('type')
    return geometry.get('type')

def extract_gemini_text(response_data):
    candidates = response_data.get('candidates', [])
    if not candidates:
        return ''

    parts = candidates[0].get('content', {}).get('parts', [])
    text = ''.join(part.get('text', '') for part in parts).strip()

    if text.startswith('```'):
        text = text.strip('`').strip()
        if text.lower().startswith('json'):
            text = text[4:].strip()

    return text

def build_ai_insight_prompt(data):
    location = data.get('location', {})
    weather = data.get('weather', {})
    statistics = data.get('analysis', {}).get('statistics', {})
    cooling = data.get('analysis', {}).get('cooling_analysis', {})
    hotspots = data.get('analysis', {}).get('hotspots', {})
    scenario = data.get('scenario')

    return f"""
You are an urban climate planning assistant for an Urban Heat Island dashboard.
Use the provided dashboard metrics only. Do not invent exact numbers.

Return a concise JSON object with these keys:
- risk_level: one of Low, Moderate, High, Severe
- summary: 2 short sentences explaining current heat and air-quality conditions
- key_drivers: array of 3 likely drivers
- recommendations: array of 4 practical city interventions
- priority_zones: array of 3 zone types to inspect on the map
- confidence_note: one short caveat about satellite/date/model limitations

Dashboard metrics:
Location: {location.get('name')}
Current air temperature: {weather.get('temperature')} °C
Precipitation: {weather.get('precipitation')} mm
Wind speed: {weather.get('windSpeed')} km/h
AQI: {weather.get('airQuality')}
PM2.5: {weather.get('pm25')}
PM10: {weather.get('pm10')}
Mean LST: {statistics.get('mean_lst')} °C
Min LST percentile: {statistics.get('min_lst')} °C
Max LST percentile: {statistics.get('max_lst')} °C
UHI intensity: {statistics.get('uhi_intensity')} °C
Mean NDVI: {statistics.get('mean_ndvi')}
Built-up area: {statistics.get('built_up_percentage')} %
Study area: {statistics.get('total_area_km2')} km²
Hotspot area: {hotspots.get('area_km2')} km²
Hotspot threshold: {hotspots.get('threshold')} °C
Mean cooling index: {cooling.get('mean_cooling_index')}
Scenario result: {json.dumps(scenario) if scenario else 'None'}
""".strip()

def get_gemini_model_candidates():
    primary_model = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')
    fallback_models = os.environ.get(
        'GEMINI_FALLBACK_MODELS',
        'gemini-3.5-flash,gemini-2.0-flash'
    )

    models = [primary_model]
    models.extend(model.strip() for model in fallback_models.split(',') if model.strip())
    return list(dict.fromkeys(models))

def call_gemini(prompt):
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError('Missing GEMINI_API_KEY in backend .env')

    payload = {
        'contents': [{
            'parts': [{'text': prompt}]
        }],
        'generationConfig': {
            'temperature': 0.2,
            'responseMimeType': 'application/json',
            'responseSchema': {
                'type': 'object',
                'properties': {
                    'risk_level': {
                        'type': 'string',
                        'enum': ['Low', 'Moderate', 'High', 'Severe']
                    },
                    'summary': {'type': 'string'},
                    'key_drivers': {
                        'type': 'array',
                        'items': {'type': 'string'}
                    },
                    'recommendations': {
                        'type': 'array',
                        'items': {'type': 'string'}
                    },
                    'priority_zones': {
                        'type': 'array',
                        'items': {'type': 'string'}
                    },
                    'confidence_note': {'type': 'string'}
                },
                'required': [
                    'risk_level',
                    'summary',
                    'key_drivers',
                    'recommendations',
                    'priority_zones',
                    'confidence_note'
                ]
            }
        }
    }

    request_data = json.dumps(payload).encode('utf-8')
    last_error = None

    for model in get_gemini_model_candidates():
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
        req = urllib.request.Request(
            url,
            data=request_data,
            headers={
                'Content-Type': 'application/json',
                'x-goog-api-key': api_key
            },
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                response_data = json.loads(response.read().decode('utf-8'))
                response_data['_model_used'] = model
                return response_data
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            last_error = (e.code, error_body)

            if e.code not in [429, 500, 502, 503, 504]:
                raise

            logger.warning(f"Gemini model {model} failed with {e.code}; trying fallback")

    if last_error:
        code, error_body = last_error
        raise urllib.error.HTTPError(
            url='https://generativelanguage.googleapis.com',
            code=code,
            msg='All configured Gemini models failed',
            hdrs=None,
            fp=io.BytesIO(error_body.encode('utf-8'))
)

    raise RuntimeError('No Gemini models configured')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'earth_engine': 'initialized' if ee_initialized else 'failed'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_uhi():
    """Main endpoint for UHI analysis"""
    try:
        data = request.json
        
        if not data or 'geometry' not in data:
            return jsonify({'error': 'Missing geometry in request'}), 400
        
        geometry = data['geometry']
        geometry_type = get_geometry_type(geometry)
        if geometry_type not in ['Polygon', 'MultiPolygon']:
            return jsonify({
                'error': f'Analysis requires an area polygon, received {geometry_type or "unknown geometry"}'
            }), 400

        city_name = data.get('city_name', 'Unnamed Area')
        date_range = data.get('date_range', {
            'start': '2023-06-01',
            'end': '2023-08-31'
        })
        
        # Generate cache key
        cache_str = f"{json.dumps(geometry, sort_keys=True)}{json.dumps(date_range, sort_keys=True)}"
        cache_key = hashlib.md5(cache_str.encode()).hexdigest()
        
        # Check cache
        if cache_key in analysis_cache:
            logger.info(f"Returning cached result for {city_name}")
            return jsonify(analysis_cache[cache_key])
        
        logger.info(f"Starting UHI analysis for {city_name}")
        
        # Run analysis
        result = uhi_analyzer.analyze_city(geometry, date_range, city_name)
        
        # Cache result
        analysis_cache[cache_key] = result
        
        # Clean old cache entries if too many
        if len(analysis_cache) > 50:
            oldest_key = next(iter(analysis_cache))
            del analysis_cache[oldest_key]
        
        logger.info(f"Analysis complete for {city_name}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/what-if', methods=['POST'])
def what_if_scenario():
    """Run what-if scenario modeling"""
    try:
        data = request.json
        area_geometry = data.get('area_geometry')
        scenario = data.get('scenario', 'increase_vegetation')
        intensity = data.get('intensity', 0.5)
        
        if not area_geometry:
            return jsonify({'error': 'Missing area geometry'}), 400
        
        result = uhi_analyzer.run_scenario(area_geometry, scenario, intensity)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Scenario analysis failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai-insights', methods=['POST'])
def ai_insights():
    """Generate AI interpretation and planning recommendations from dashboard metrics."""
    try:
        data = request.json or {}
        if 'analysis' not in data:
            return jsonify({'error': 'Missing analysis data'}), 400

        prompt = build_ai_insight_prompt(data)
        gemini_response = call_gemini(prompt)
        text = extract_gemini_text(gemini_response)

        if not text:
            return jsonify({'error': 'Gemini returned an empty response'}), 502

        try:
            insight = json.loads(text)
        except json.JSONDecodeError:
            insight = {'summary': text}

        return jsonify({
            'model': gemini_response.get('_model_used', os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')),
            'insight': insight
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        logger.error(f"Gemini API error: {error_body}")
        return jsonify({'error': 'Gemini API request failed', 'details': error_body}), 502
    except Exception as e:
        logger.error(f"AI insight generation failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cities', methods=['GET'])
def get_sample_cities():
    """Return sample cities for quick analysis"""
    cities = [
        {'name': 'New York City, USA', 'lat': 40.7128, 'lon': -74.006, 'zoom': 11},
        {'name': 'Tokyo, Japan', 'lat': 35.6762, 'lon': 139.6503, 'zoom': 11},
        {'name': 'Mumbai, India', 'lat': 19.076, 'lon': 72.8777, 'zoom': 11},
        {'name': 'London, UK', 'lat': 51.5074, 'lon': -0.1278, 'zoom': 11},
        {'name': 'Sydney, Australia', 'lat': -33.8688, 'lon': 151.2093, 'zoom': 11}
    ]
    return jsonify(cities)

@app.route('/api/export/report', methods=['POST'])
def export_report():
    """Generate and download analysis report"""
    try:
        data = request.json
        return jsonify({
            'message': 'Report generation endpoint',
            'format': 'pdf',
            'status': 'not implemented in demo'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Binds to 0.0.0.0 and grabs PORT variable correctly for local or alternative deployment fallback
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)