import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';
import { MAPBOX_SUPPORT_REASONS } from '@/lib/constants';

// Set the Mapbox access token globally for all map instances
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

/**
 * Determines if the current browser environment supports Mapbox GL JS
 * @returns boolean indicating if Mapbox GL is supported
 */
export function isMapboxSupported(): boolean {
  return mapboxgl.supported();
}

/**
 * Provides detailed information about Mapbox GL support status
 * @returns Object containing support status and reason if not supported
 */
export function getMapboxSupportStatus(): { supported: boolean; reason?: string } {
  if (mapboxgl.supported()) {
    return { supported: true };
  }
  
  // Check for WebGL support in the browser
  if (!window.WebGLRenderingContext) {
    return { 
      supported: false, 
      reason: MAPBOX_SUPPORT_REASONS.NO_WEBGL
    };
  }
  
  // Verify WebGL context can be created
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
 * Creates and initializes a new Mapbox map instance
 * @param container - HTML element that will contain the map
 * @param options - Optional configuration for the map instance
 * @returns Mapbox map instance or null if initialization fails
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