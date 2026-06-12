import ee
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UHIAnalyzer:
    """Urban Heat Island Analysis using Google Earth Engine"""
    
    def __init__(self):
        self.landsat_collection = 'LANDSAT/LC08/C02/T1_L2'
        self.sentinel_collection = 'COPERNICUS/S2_SR_HARMONIZED'
        self.dynamic_world = 'GOOGLE/DYNAMICWORLD/V1'

    def _require_number(self, stats, key):
        value = stats.get(key).getInfo()
        if value is None:
            raise ValueError(f'No valid Earth Engine pixels returned for {key}')
        return value
        
    def analyze_city(self, geometry, date_range, city_name):
        """Comprehensive UHI analysis for a city"""
        try:
            # Convert geometry to Earth Engine object
            ee_geometry = ee.Geometry(geometry)
            
            # Run all analyses in parallel
            lst_data = self._calculate_lst(ee_geometry, date_range)
            ndvi_data = self._calculate_ndvi(ee_geometry, date_range)
            lulc_data = self._get_lulc(ee_geometry)
            
            # Post-processing
            hotspots = self._detect_hotspots(ee_geometry, date_range, lst_data, lulc_data)
            cooling_potential = self._calculate_cooling_potential(ee_geometry, date_range, lst_data, ndvi_data, lulc_data)
            statistics = self._calculate_statistics(ee_geometry, date_range, lst_data, ndvi_data, lulc_data)
            
            # Get tile URLs for visualization
            lst_tiles = self._get_tile_url(lst_data['mean_lst_image'], 'lst')
            ndvi_tiles = self._get_tile_url(ndvi_data['mean_ndvi_image'], 'ndvi')
            lulc_tiles = self._get_tile_url(lulc_data['classification_image'], 'lulc')
            cooling_tiles = self._get_tile_url(cooling_potential['image'], 'cooling')
            hotspot_tiles = self._get_tile_url(hotspots['mask_image'], 'hotspot')
            
            return {
                'city_name': city_name,
                'analysis_date': datetime.now().isoformat(),
                'date_range': date_range,
                'layers': {
                    'lst': {
                        'tile_url': lst_tiles['url'],
                        'min': 20,
                        'max': 50,
                        'units': '°C'
                    },
                    'ndvi': {
                        'tile_url': ndvi_tiles['url'],
                        'min': -1,
                        'max': 1
                    },
                    'lulc': {
                        'tile_url': lulc_tiles['url'],
                        'classes': lulc_data['class_names']
                    },
                    'cooling': {
                        'tile_url': cooling_tiles['url'],
                        'min': -1,
                        'max': 1
                    },
                    'hotspots': {
                        'tile_url': hotspot_tiles['url']
                    }
                },
                'statistics': statistics,
                'hotspots': {
                    'threshold': hotspots['threshold'],
                    'area_km2': hotspots['area_km2'],
                    'geometry': hotspots['geometry']
                },
                'cooling_analysis': cooling_potential['statistics']
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_city: {str(e)}")
            raise
    
    def _calculate_lst(self, geometry, date_range):
        """Calculate Land Surface Temperature"""
        collection = (ee.ImageCollection(self.landsat_collection)
                     .filterBounds(geometry)
                     .filterDate(date_range['start'], date_range['end'])
                     .filter(ee.Filter.lt('CLOUD_COVER', 20)))
        
        def calc_lst(image):
            lst = (image.select('ST_B10')
                   .multiply(0.00341802)
                   .add(149.0)
                   .subtract(273.15)
                   .rename('LST'))
            lst = lst.updateMask(lst.gt(0).And(lst.lt(70)))
            return lst.copyProperties(image, ['system:time_start'])
        
        lst_collection = collection.map(calc_lst)
        mean_lst = lst_collection.mean().clip(geometry)
        max_lst = lst_collection.max().clip(geometry)
        
        return {
            'mean_lst_image': mean_lst,
            'max_lst_image': max_lst,
            'collection_size': collection.size().getInfo()
        }
    
    def _calculate_ndvi(self, geometry, date_range):
        """Calculate NDVI from Sentinel-2"""
        collection = (ee.ImageCollection(self.sentinel_collection)
                     .filterBounds(geometry)
                     .filterDate(date_range['start'], date_range['end'])
                     .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))
        
        def calc_ndvi(image):
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return ndvi.copyProperties(image, ['system:time_start'])
        
        ndvi_collection = collection.map(calc_ndvi)
        mean_ndvi = ndvi_collection.mean().clip(geometry)
        
        return {
            'mean_ndvi_image': mean_ndvi,
            'collection_size': collection.size().getInfo()
        }
    
    def _get_lulc(self, geometry):
        """Get Land Use Land Cover classification"""
        collection = (ee.ImageCollection(self.dynamic_world)
                     .filterBounds(geometry)
                     .filterDate('2023-01-01', '2023-12-31'))
        
        classification = collection.select('label').mode().clip(geometry)
        
        class_names = {
            0: 'Water', 1: 'Trees', 2: 'Grass', 3: 'Flooded vegetation',
            4: 'Crops', 5: 'Shrub & scrub', 6: 'Built area', 7: 'Bare ground', 8: 'Snow & ice'
        }
        
        return {
            'classification_image': classification,
            'class_names': class_names
        }
    
    def _detect_hotspots(self, geometry, date_range, lst_data=None, lulc_data=None):
        """Detect UHI hotspots using statistical method"""
        lst_data = lst_data or self._calculate_lst(geometry, date_range)
        lulc_data = lulc_data or self._get_lulc(geometry)
        land_mask = lulc_data['classification_image'].neq(0)
        mean_lst = lst_data['mean_lst_image'].updateMask(land_mask)
        
        stats = mean_lst.reduceRegion(
            reducer=ee.Reducer.mean().combine(ee.Reducer.stdDev(), '', True),
            geometry=geometry, scale=30, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        mean_val = ee.Number(stats.get('LST_mean'))
        std_val = ee.Number(stats.get('LST_stdDev'))
        
        threshold = mean_val.add(std_val.multiply(1.5))
        hotspot_mask = mean_lst.gt(threshold).selfMask()
        
        pixel_area = ee.Image.pixelArea()
        hotspot_area = (pixel_area.updateMask(hotspot_mask)
                       .reduceRegion(
                           reducer=ee.Reducer.sum(),
                           geometry=geometry, scale=30, maxPixels=1e9, bestEffort=True, tileScale=4
                       ))

        return {
            'mask_image': hotspot_mask,
            'threshold': threshold.getInfo(),
            'area_km2': round((hotspot_area.get('area', 0).getInfo() or 0) / 1e6, 2),
            'geometry': None
        }
    
    def _calculate_cooling_potential(self, geometry, date_range, lst_data=None, ndvi_data=None, lulc_data=None):
        """Calculate urban cooling potential"""
        lst_data = lst_data or self._calculate_lst(geometry, date_range)
        ndvi_data = ndvi_data or self._calculate_ndvi(geometry, date_range)
        lulc_data = lulc_data or self._get_lulc(geometry)
        land_mask = lulc_data['classification_image'].neq(0)
        mean_lst = lst_data['mean_lst_image'].updateMask(land_mask)
        mean_ndvi = ndvi_data['mean_ndvi_image']
        
        stacked = mean_lst.addBands(mean_ndvi)
        correlation = stacked.reduceNeighborhood(
            reducer=ee.Reducer.pearsonsCorrelation(),
            kernel=ee.Kernel.square(150, 'meters')
        )
        
        cooling_index = correlation.select('correlation').multiply(-1)
        stats = cooling_index.reduceRegion(
            reducer=ee.Reducer.mean().combine(ee.Reducer.stdDev(), '', True),
            geometry=geometry, scale=30, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        return {
            'image': cooling_index,
            'statistics': {
                'mean_cooling_index': stats.get('correlation_mean', 0).getInfo(),
                'std_cooling_index': stats.get('correlation_stdDev', 0).getInfo()
            }
        }
    
    def _calculate_statistics(self, geometry, date_range, lst_data=None, ndvi_data=None, lulc_data=None):
        """Calculate summary statistics with unified land masking"""
        lst_data = lst_data or self._calculate_lst(geometry, date_range)
        ndvi_data = ndvi_data or self._calculate_ndvi(geometry, date_range)
        lulc_data = lulc_data or self._get_lulc(geometry)
        
        classification = lulc_data['classification_image']
        land_mask = classification.neq(0)
        mean_lst = lst_data['mean_lst_image'].updateMask(land_mask)
        mean_ndvi = ndvi_data['mean_ndvi_image']
        
        urban_mask = classification.eq(6) 
        rural_mask = classification.eq(1).Or(classification.eq(2)).Or(classification.eq(5))
        
        urban_lst_stats = mean_lst.updateMask(urban_mask).reduceRegion(
            reducer=ee.Reducer.mean(), geometry=geometry, scale=30, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        rural_lst_stats = mean_lst.updateMask(rural_mask).reduceRegion(
            reducer=ee.Reducer.mean(), geometry=geometry, scale=30, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        lst_stats = mean_lst.reduceRegion(
            reducer=ee.Reducer.mean()
                .combine(ee.Reducer.minMax(), '', True)
                .combine(ee.Reducer.stdDev(), '', True)
                .combine(ee.Reducer.percentile([5, 95]), '', True),
            geometry=geometry, scale=30, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        ndvi_stats = mean_ndvi.reduceRegion(
            reducer=ee.Reducer.mean().combine(ee.Reducer.stdDev(), '', True),
            geometry=geometry, scale=10, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        built_up_area = ee.Image.pixelArea().updateMask(urban_mask).reduceRegion(
            reducer=ee.Reducer.sum(), geometry=geometry, scale=10, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        total_area = ee.Image.pixelArea().reduceRegion(
            reducer=ee.Reducer.sum(), geometry=geometry, scale=10, maxPixels=1e9, bestEffort=True, tileScale=4
        )
        
        total_area_m2 = self._require_number(total_area, 'area')
        if total_area_m2 <= 0:
            raise ValueError('Analysis geometry has zero area')

        built_up_area_m2 = built_up_area.get('area').getInfo() or 0
        built_up_pct = (built_up_area_m2 / total_area_m2) * 100
        
        urban_mean = urban_lst_stats.get('LST').getInfo() or self._require_number(lst_stats, 'LST_mean')
        rural_mean = rural_lst_stats.get('LST').getInfo() or self._require_number(lst_stats, 'LST_p5')
        
        true_uhi_intensity = urban_mean - rural_mean
        max_lst = self._require_number(lst_stats, 'LST_p95')
        min_lst = self._require_number(lst_stats, 'LST_p5')
        
        return {
            'mean_lst': round(self._require_number(lst_stats, 'LST_mean'), 2),
            'max_lst': round(max_lst, 2),
            'min_lst': round(min_lst, 2),
            'std_lst': round(self._require_number(lst_stats, 'LST_stdDev'), 2),
            'uhi_intensity': round(true_uhi_intensity, 2),
            'mean_ndvi': round(self._require_number(ndvi_stats, 'NDVI_mean'), 3),
            'std_ndvi': round(self._require_number(ndvi_stats, 'NDVI_stdDev'), 3),
            'built_up_percentage': round(built_up_pct, 1),
            'total_area_km2': round(total_area_m2 / 1e6, 2)
        }
    
    def _get_tile_url(self, image, layer_type):
        """Generate tile URL for visualization"""
        vis_params = {
            'lst': {'min': 20, 'max': 50, 'palette': [
                '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
                '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
            ]},
            'ndvi': {'min': -1, 'max': 1, 'palette': [
                '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf',
                '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'
            ]},
            'lulc': {'min': 0, 'max': 8, 'palette': [
                '#419BDF', '#397D49', '#88B053', '#7A87C6',
                '#E49635', '#DFC35A', '#C4281B', '#A59B8F', '#B39FE1'
            ]},
            'cooling': {'min': -1, 'max': 1, 'palette': [
                '#2166ac', '#67a9cf', '#d1e5f0', '#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b'
            ]},
            'hotspot': {'min': 0, 'max': 1, 'palette': ['#00000000', '#ff0000']}
        }
        params = vis_params.get(layer_type, {'min': 0, 'max': 1, 'palette': ['white', 'black']})
        map_id = image.getMapId(params)
        return {'url': map_id['tile_fetcher'].url_format, 'token': map_id.get('token', '')}
    
    def run_scenario(self, area_geometry, scenario, intensity, active_date_range=None):
        """Run what-if scenario modeling using masked baseline data matching the query date"""
        ee_area = ee.Geometry(area_geometry)
        
        # Fallback to standard range if active range isn't forwarded by backend route handler
        date_range = active_date_range or {'start': '2023-06-01', 'end': '2023-08-31'}
        
        lst_data = self._calculate_lst(ee_area, date_range)
        lulc_data = self._get_lulc(ee_area)
        
        # Apply water mask so ocean polygons don't suppress simulation projections
        land_mask = lulc_data['classification_image'].neq(0)
        mean_lst = lst_data['mean_lst_image'].updateMask(land_mask)
        
        stats = mean_lst.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=ee_area,
            scale=30,
            maxPixels=1e9
        )
        
        current_lst = stats.get('LST_mean', 35.0).getInfo()
        
        if scenario == 'increase_vegetation':
            lst_reduction = intensity * 3.5
            confidence = 0.85
        elif scenario == 'cool_roofs':
            lst_reduction = intensity * 2.5
            confidence = 0.78
        elif scenario == 'urban_forestry':
            lst_reduction = intensity * 4.0
            confidence = 0.82
        else:
            lst_reduction = intensity * 2.0
            confidence = 0.70
        
        predicted_lst = current_lst - lst_reduction
        cooling_percentage = round((lst_reduction / current_lst) * 100, 1)
        
        return {
            'current_mean_lst': round(current_lst, 2),
            'scenario': scenario,
            'intensity': intensity,
            'predicted_lst_reduction': round(lst_reduction, 2),
            'predicted_new_lst': round(predicted_lst, 2),
            'cooling_benefit_percentage': cooling_percentage,
            'confidence': confidence,
            'equivalent_trees': round(intensity * 500) if scenario == 'increase_vegetation' else None
        }