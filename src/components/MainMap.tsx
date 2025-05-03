// src/components/MainMap.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import { useMapInitialization } from "@/lib/hooks/useMapInitialization";
import {
  SKY_LAYER_CONFIG,
  BUILDINGS_LAYER_CONFIG,
  Z_INDEX
} from "@/lib/constants";

export function MainMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { map: contextMap, setMap, setZoom } = useMap()

  const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
    loadedMap.addLayer(SKY_LAYER_CONFIG);
    console.log("Sky layer added.");

    const layers = loadedMap.getStyle().layers;
          let firstSymbolId;
          if (layers) {
            for (const layer of layers) {
                if (layer.type === 'symbol') {
                    firstSymbolId = layer.id;
                    break;
                }
            }
          }
    loadedMap.addLayer(BUILDINGS_LAYER_CONFIG, firstSymbolId);
    console.log("3D buildings layer added.");

    setMap(loadedMap);

  }, [setMap]);

  const handleMapZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, [setZoom]);

  // Use the initialization hook
  useMapInitialization({
    containerRef: mapContainerRef,
    onLoad: handleMapLoad,
    onZoom: handleMapZoom,
    logCameraParams: false
  });

  // Resize map when context map instance changes (initial load)
  useEffect(() => {
    contextMap?.resize()
  }, [contextMap])

  return (
    <div ref={mapContainerRef} className="absolute inset-0" style={{ zIndex: Z_INDEX.map }} data-testid="main-map-container" />
  )
} 