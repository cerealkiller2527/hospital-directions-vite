import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';
import { MAPBOX_SUPPORT_REASONS } from '@/lib/constants';

// Set the access token globally
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

/**
 * Check if Mapbox GL is supported in the current browser
 */
export function isMapboxSupported(): boolean {
  return mapboxgl.supported();
}

/**
 * Get detailed Mapbox support status with reason if not supported
 */
export function getMapboxSupportStatus(): { supported: boolean; reason?: string } {
  if (mapboxgl.supported()) {
    return { supported: true };
  }
  
  // WebGL detection
  if (!window.WebGLRenderingContext) {
    return { 
      supported: false, 
      reason: MAPBOX_SUPPORT_REASONS.NO_WEBGL
    };
  }
  
  // Check if a canvas can get a WebGL context
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!context) {
    return { 
      supported: false, 
      reason: MAPBOX_SUPPORT_REASONS.WEBGL_DISABLED
    };
  }
  
  return { 
    supported: false, 
    reason: MAPBOX_SUPPORT_REASONS.UNKNOWN
  };
}

/**
 * Initialize a Mapbox map with error handling
 */
export function initializeMap(
  container: HTMLElement,
  options: Partial<mapboxgl.MapOptions> = {}
): mapboxgl.Map | null {
  if (!isMapboxSupported()) {
    console.error('Mapbox GL is not supported in this browser.');
    return null;
  }
  
  try {
    console.log("Attempting to initialize Mapbox map...");
    const map = new mapboxgl.Map({
      container,
      style: options.style,
      center: options.center,
      zoom: options.zoom,
      ...options
    });
    console.log("Mapbox map initialized successfully.");
    return map;
  } catch (error) {
    console.error('Error initializing Mapbox GL:', error);
    return null;
  }
} 