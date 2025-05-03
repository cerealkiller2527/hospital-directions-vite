import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import type { EnrichedRoute } from '@/lib/services/directions';
import type { FeatureCollection, Feature, LineString } from 'geojson';

// Define congestion colors (can be moved to constants if needed elsewhere)
const congestionColors: Record<string, string> = {
  low: '#0059b3',      // Dark Primary Blue (Consistent with App.tsx)
  moderate: '#ffa500',  // Orange
  heavy: '#ff4500',    // Orange Red
  severe: '#b22222',    // Firebrick (Dark Red)
  unknown: '#0059b3',   // Dark Primary Blue fallback
};

interface RouteLayerManagerProps {
  routes: EnrichedRoute[] | null;
  onSelectRoute: (route: EnrichedRoute) => void;
}

// Helper to create GeoJSON from routes
const createRoutesGeoJSON = (routes: EnrichedRoute[] | null): FeatureCollection<LineString> => {
  if (!routes) {
    return { type: 'FeatureCollection', features: [] };
  }
  
  const allSegmentFeatures: Feature<LineString>[] = [];

  routes.forEach(route => {
    const coordinates = route.geometry.coordinates;
    const congestionLevels = route.congestion || [];
    const routeId = route.id;
    const isActive = route.isActive ?? false;

    if (coordinates.length > 1) {
      for (let i = 0; i < coordinates.length - 1; i++) {
        const segmentCoordinates = [
          coordinates[i],
          coordinates[i + 1]
        ];
        const segmentCongestion = congestionLevels[i] || 'unknown';

        const segmentFeature: Feature<LineString> = {
          type: 'Feature',
          properties: {
            routeId: routeId,
            isActive: isActive,
            congestion: segmentCongestion,
          },
          geometry: {
            type: 'LineString',
            coordinates: segmentCoordinates
          }
        };
        allSegmentFeatures.push(segmentFeature);
      }
    }
  });

  return { type: 'FeatureCollection', features: allSegmentFeatures };
};

// Non-rendering component to manage route layers
export function RouteLayerManager({ routes, onSelectRoute }: RouteLayerManagerProps) {
  const { map: mapInstance } = useMap();
  const initializedRef = useRef(false); // Track if layers/source have been added
  const hoveredRouteIdRef = useRef<string | null>(null); // Track hover state for paint updates

  const sourceId = 'routes-source';
  const inactiveCasingId = 'routes-inactive-casing';
  const activeCasingId = 'routes-active-casing';
  const inactiveLayerId = 'routes-inactive';
  const activeLayerId = 'routes-active';
  const layerIds = [inactiveCasingId, activeCasingId, inactiveLayerId, activeLayerId];
  const interactionLayerIds = [inactiveCasingId, activeCasingId]; // Layers for mouse events
  const beforeId = 'road-label'; // Layer to insert before

  // Effect to Initialize Source and Layers
  useEffect(() => {
    if (!mapInstance || initializedRef.current) return;

    // Check if source already exists (e.g., due to HMR)
    if (mapInstance.getSource(sourceId)) {
      console.warn(`Source '${sourceId}' already exists. Skipping initialization.`);
      initializedRef.current = true; // Assume layers are also there
      return;
    }

    mapInstance.addSource(sourceId, {
      type: 'geojson',
      data: createRoutesGeoJSON(null) // Start empty
    });

    // INACTIVE Casing (Invisible, wide hitbox)
    mapInstance.addLayer({ id: inactiveCasingId, type: 'line', source: sourceId, filter: ['==', 'isActive', false], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 15, 'line-opacity': 0, 'line-color': '#000' } }, beforeId);
    // ACTIVE Casing (Invisible, wide hitbox)
    mapInstance.addLayer({ id: activeCasingId, type: 'line', source: sourceId, filter: ['==', 'isActive', true], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 15, 'line-opacity': 0, 'line-color': '#000' } }, beforeId);
    // INACTIVE Layer (Visible, styled)
    mapInstance.addLayer({ id: inactiveLayerId, type: 'line', source: sourceId, filter: ['==', 'isActive', false], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 8, 'line-opacity': 0.6, 'line-color': '#0059b3' } }, beforeId);
    // ACTIVE Layer (Visible, styled with traffic)
    mapInstance.addLayer({ id: activeLayerId, type: 'line', source: sourceId, filter: ['==', 'isActive', true], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 8, 'line-opacity': 0.9, 'line-color': ['match', ['get', 'congestion'], 'low', congestionColors.low, 'moderate', congestionColors.moderate, 'heavy', congestionColors.heavy, 'severe', congestionColors.severe, congestionColors.unknown] } }, beforeId);

    initializedRef.current = true;
    console.log("RouteLayerManager: Initialized source and layers.");

    // Cleanup function
    return () => {
      if (mapInstance && mapInstance.getStyle()) { // Check if map is still valid
        layerIds.forEach(id => { try { if (mapInstance.getLayer(id)) mapInstance.removeLayer(id); } catch (e) { console.warn(`Error removing layer ${id}`, e); } });
        try { if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId); } catch (e) { console.warn(`Error removing source ${sourceId}`, e); }
        initializedRef.current = false; 
        console.log("RouteLayerManager: Cleaned up source and layers.");
      }
    };
  }, [mapInstance]);

  // Effect to Update Source Data and Fit Bounds
  useEffect(() => {
    if (!mapInstance || !initializedRef.current) return;
    
    const source = mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource;
    if (!source) return;

    const geojsonData = createRoutesGeoJSON(routes);
    source.setData(geojsonData);
    console.log("RouteLayerManager: Updated source data.");

    // Fit Bounds to the ACTIVE route
    const activeRoute = routes?.find(r => r.isActive);
    if (activeRoute?.geometry?.coordinates && activeRoute.geometry.coordinates.length > 0) {
      const coordinates = activeRoute.geometry.coordinates as mapboxgl.LngLatLike[];
      const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
      coordinates.forEach(coord => bounds.extend(coord));
      
      mapInstance.fitBounds(bounds, {
          padding: { top: 100, bottom: 200, left: 450, right: 100 },
          pitch: 45, 
          bearing: mapInstance.getBearing(),
          maxZoom: 16, 
          duration: 1500 
      });
    }
  }, [mapInstance, routes]); // Depend on map and routes data

  // Effect for Interactions
  useEffect(() => {
    if (!mapInstance || !initializedRef.current) return;

    const handleMouseEnter = (e: mapboxgl.MapLayerMouseEvent) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
      if (e.features && e.features.length > 0) {
         const featureRouteId = e.features[0].properties?.routeId; 
         if (featureRouteId && hoveredRouteIdRef.current !== featureRouteId) {
           hoveredRouteIdRef.current = featureRouteId;
           // Optionally trigger paint update if hover style changes needed
         }
      }
    };

    const handleMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = '';
      if (hoveredRouteIdRef.current !== null) {
          hoveredRouteIdRef.current = null;
          // Optionally trigger paint update if hover style changes needed
      }
    };

    const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const clickedRouteId = e.features[0].properties?.routeId;
        const clickedRoute = routes?.find(r => r.id === clickedRouteId);
        if (clickedRoute) {
          onSelectRoute(clickedRoute);
        }
      }
    };

    // Attach listeners to interaction layers
    interactionLayerIds.forEach(layerId => {
      mapInstance.on('mouseenter', layerId, handleMouseEnter);
      mapInstance.on('mouseleave', layerId, handleMouseLeave);
      mapInstance.on('click', layerId, handleClick);
    });

    // Cleanup listeners
    return () => {
      if (mapInstance && mapInstance.getStyle()) { // Check map validity
        interactionLayerIds.forEach(layerId => {
          try {
            mapInstance.off('mouseenter', layerId, handleMouseEnter);
            mapInstance.off('mouseleave', layerId, handleMouseLeave);
            mapInstance.off('click', layerId, handleClick);
          } catch(e) { console.warn(`Error removing listeners for ${layerId}`, e); }
        });
        // Reset cursor on cleanup just in case
        try { mapInstance.getCanvas().style.cursor = ''; } catch(e) {}
      }
    };

  }, [mapInstance, routes, onSelectRoute]); // Depend on map, routes, and the selection handler

  return null; // This component does not render anything itself
} 