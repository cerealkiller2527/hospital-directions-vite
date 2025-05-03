import { useState, useEffect, useRef } from 'react';
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

  // Effect for initializing the map
  useEffect(() => {
    let map: mapboxgl.Map | null = null;

    if (containerRef.current && !mapInstance) { // Initialize only if ref is valid and map doesn't exist
      map = initializeMap(containerRef.current, {
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

      if (map) {
        setMapInstance(map); // Set state once initialized

        // Define log handler if requested
        if (logCameraParams) {
          logCameraParamsHandlerRef.current = () => {
            if (!map) return;
            const center = map.getCenter();
            const zoom = map.getZoom();
            const pitch = map.getPitch();
            const bearing = map.getBearing();
            console.log('Map Camera Params:',
              `\n  Center: [${center.lng.toFixed(6)}, ${center.lat.toFixed(6)}]`,
              `\n  Zoom: ${zoom.toFixed(2)}`,
              `\n  Pitch: ${pitch.toFixed(2)}`,
              `\n  Bearing: ${bearing.toFixed(2)}`
            );
          };
        }

        // --- Event Listeners ---
        map.on('load', () => {
          if (!map) return;
          console.log("Map loaded via hook.");
          map.resize(); // Initial resize
          onLoad?.(map); // Call onLoad callback
        });

        map.on('zoom', () => {
          if (!map) return;
          onZoom?.(map.getZoom()); // Call onZoom callback
        });

        if (logCameraParamsHandlerRef.current) {
          map.on('moveend', logCameraParamsHandlerRef.current);
        }
      }
    }

    // --- Cleanup Function ---
    return () => {
      if (map) {
        // Remove listeners
        if (logCameraParamsHandlerRef.current) {
          try { map.off('moveend', logCameraParamsHandlerRef.current); } catch (e) { console.warn("Error removing listener", e); }
        }
        // Remove other listeners if added here (e.g., zoom, load if necessary)
        // map.off('zoom', ...);
        // map.off('load', ...);
        try { map.remove(); } catch (e) { console.warn("Error removing map", e); }
      }
      // Reset the internal state on cleanup
      setMapInstance(null); 
      console.log("Map initialization hook cleanup ran."); // Add log for cleanup
    };
  // Remove 'options' from the dependency array
  }, [containerRef, onZoom, onLoad, logCameraParams]); // Re-run if container ref or callbacks change

  return mapInstance; // Return the map instance state
} 