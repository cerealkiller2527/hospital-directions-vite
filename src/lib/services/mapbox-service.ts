import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';

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
      reason: "Your browser doesn't support WebGL, which is required for Mapbox GL."
    };
  }
  
  // Check if a canvas can get a WebGL context
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!context) {
    return { 
      supported: false, 
      reason: "Your browser supports WebGL, but it may be disabled or unavailable."
    };
  }
  
  return { 
    supported: false, 
    reason: "Mapbox GL isn't supported by your browser for an unknown reason."
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
    return new mapboxgl.Map({
      container,
      style: options.style,
      center: options.center,
      zoom: options.zoom,
      ...options
    });
  } catch (error) {
    console.error('Error initializing Mapbox GL:', error);
    return null;
  }
} 