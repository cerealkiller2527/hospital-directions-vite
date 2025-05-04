import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { initializeMap } from '@/lib/services/mapbox-service';
import { MAP_STYLE, DEFAULT_MAP_VIEW } from '@/lib/mapbox';

interface UseMapInitializationProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  options?: Partial<mapboxgl.MapOptions>;
  onZoom?: (zoom: number) => void; // Callback for zoom changes
  onLoad?: (map: mapboxgl.Map) => void; // Callback when map is loaded
  logCameraParams?: boolean; // Optional flag to log camera params on move end
}

export function useMapInitialization({
  containerRef,
  options = {},
  onZoom,
  onLoad,
  logCameraParams = false, // Default to false
}: UseMapInitializationProps): mapboxgl.Map | null {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  // Use a ref to hold the log handler to avoid re-binding in useEffect deps
  const logCameraParamsHandlerRef = useRef<(() => void) | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null); // Use a ref to hold the map instance internally

  // --- Define Stable Listener Functions --- 
  const handleMapLoad = useCallback(() => {
    if (!mapRef.current) return;
    console.log("Map loaded via hook.");
    mapRef.current.resize();
    setMapInstance(mapRef.current);
    onLoad?.(mapRef.current);
  }, [onLoad]); // Dependency: onLoad callback

  const handleMapZoom = useCallback(() => {
    if (!mapRef.current) return;
    onZoom?.(mapRef.current.getZoom());
  }, [onZoom]); // Dependency: onZoom callback

  const handleMoveEndLog = useCallback(() => {
    if (!mapRef.current || !logCameraParams) return;
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const pitch = mapRef.current.getPitch();
    const bearing = mapRef.current.getBearing();
    console.log('Map Camera Params:',
      `\n  Center: [${center.lng.toFixed(6)}, ${center.lat.toFixed(6)}]`,
      `\n  Zoom: ${zoom.toFixed(2)}`,
      `\n  Pitch: ${pitch.toFixed(2)}`,
      `\n  Bearing: ${bearing.toFixed(2)}`
    );
  }, [logCameraParams]); // Dependency: logCameraParams flag

  // Effect for initializing the map
  useEffect(() => {
    // Initialize only if ref is valid and internal mapRef is null
    if (containerRef.current && !mapRef.current) { 
      const map = initializeMap(containerRef.current, {
        style: MAP_STYLE,
        center: DEFAULT_MAP_VIEW.center as [number, number],
        zoom: DEFAULT_MAP_VIEW.zoom,
        minZoom: DEFAULT_MAP_VIEW.minZoom,
        maxZoom: DEFAULT_MAP_VIEW.maxZoom,
        pitch: DEFAULT_MAP_VIEW.pitch,
        bearing: DEFAULT_MAP_VIEW.bearing,
        renderWorldCopies: false,
        ...options, // Allow overriding defaults
      });
      mapRef.current = map; // Store the map instance immediately in the ref

      if (map) {
        // Define log handler if requested
        if (logCameraParams) {
          logCameraParamsHandlerRef.current = handleMoveEndLog;
        }

        // --- Attach Event Listeners ---
        map.on('load', handleMapLoad);
        map.on('zoom', handleMapZoom);
        if (logCameraParams) {
          map.on('moveend', handleMoveEndLog);
        }
      }
    }

    // --- Cleanup Function ---
    return () => {
      const mapToRemove = mapRef.current; // Get map from ref for cleanup
      if (mapToRemove) {
        // --- Remove Event Listeners ---
        try { mapToRemove.off('load', handleMapLoad); } catch (e) { console.warn("Error removing load listener", e); }
        try { mapToRemove.off('zoom', handleMapZoom); } catch (e) { console.warn("Error removing zoom listener", e); }
        if (logCameraParams) {
          try { mapToRemove.off('moveend', handleMoveEndLog); } catch (e) { console.warn("Error removing moveend listener", e); }
        }
      }
      // Reset the state and internal ref
      setMapInstance(null); 
      mapRef.current = null;
      console.log("Map initialization hook cleanup ran (listeners removed)."); 
    };
  // Remove 'options' from the dependency array
  }, [containerRef, onZoom, onLoad, logCameraParams, handleMapLoad, handleMapZoom, handleMoveEndLog]); // Re-run if container ref or callbacks change

  return mapInstance; // Return the map instance state
} 