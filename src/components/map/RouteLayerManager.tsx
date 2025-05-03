import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import type { EnrichedRoute } from '@/lib/services/directions';
import type { FeatureCollection, Feature, LineString } from 'geojson';
import { MAP_LAYER_IDS, MAP_LAYER_BEFORE_ID, ROUTE_FIT_BOUNDS_OPTIONS, CONGESTION_COLORS } from '@/lib/constants'; // Import constants

// Re-add the props interface definition
interface RouteLayerManagerProps {
  routes: EnrichedRoute[] | null;
  onSelectRoute: (route: EnrichedRoute) => void;
}

// Helper to create GeoJSON from routes
const createRoutesGeoJSON = (routes: EnrichedRoute[] | null): FeatureCollection<LineString> => {
  if (!routes) {
    return { type: 'FeatureCollection', features: [] };
  }

  const allFeatures: Feature<LineString>[] = [];

  routes.forEach(route => {
    const coordinates = route.geometry.coordinates;
    const routeId = route.id;
    const isActive = route.isActive ?? false;

    if (isActive) {
      /* ACTIVE route: Create segments for congestion coloring - TODO: This is a hack to get the active route to show up
      TODO: This is a hack to get the active route to show up a proper fix would be to use google maps polyline encoding, 
      but this is against the terms of service */
      const congestionLevels = route.congestion || [];
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
          allFeatures.push(segmentFeature);
        }
      }
    } else {
      /* INACTIVE route: Create a single feature for the whole route - 
      TODO: This is a hack to get the inactive route to show up a proper fix would be to use google maps polyline encoding, 
      but this is against the terms of service */
      if (coordinates.length > 1) {
        const routeFeature: Feature<LineString> = {
          type: 'Feature',
          properties: {
            routeId: routeId,
            isActive: isActive,
            // No congestion property needed for inactive style
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates // Use all coordinates
          }
        };
        allFeatures.push(routeFeature);
      }
    }
  });

  return { type: 'FeatureCollection', features: allFeatures };
};

// Non-rendering component to manage route layers
export function RouteLayerManager({ routes, onSelectRoute }: RouteLayerManagerProps) {
  const { map: mapInstance } = useMap();
  const initializedRef = useRef(false); // Track if layers/source have been added
  const hoveredRouteIdRef = useRef<string | null>(null); // Track hover state for paint updates

  // Use constants for IDs
  const sourceId = MAP_LAYER_IDS.SOURCE;
  const inactiveCasingId = MAP_LAYER_IDS.INACTIVE_CASING;
  const activeCasingId = MAP_LAYER_IDS.ACTIVE_CASING;
  const inactiveLayerId = MAP_LAYER_IDS.INACTIVE_ROUTE;
  const activeLayerId = MAP_LAYER_IDS.ACTIVE_ROUTE;
  const layerIds = [inactiveCasingId, activeCasingId, inactiveLayerId, activeLayerId];
  const interactionLayerIds = [inactiveCasingId, activeCasingId]; // Layers for mouse events
  const beforeId = MAP_LAYER_BEFORE_ID; // Layer to insert before

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
    mapInstance.addLayer({ id: inactiveCasingId, type: 'line', source: sourceId, filter: ['==', 'isActive', false], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 18, 'line-opacity': 0, 'line-color': '#000' } }, beforeId);
    // ACTIVE Casing (Invisible, wide hitbox)
    mapInstance.addLayer({ id: activeCasingId, type: 'line', source: sourceId, filter: ['==', 'isActive', true], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 18, 'line-opacity': 0, 'line-color': '#000' } }, beforeId);
    // INACTIVE Layer (Visible, styled)
    mapInstance.addLayer({ id: inactiveLayerId, type: 'line', source: sourceId, filter: ['==', 'isActive', false], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 10, 'line-opacity': 0.6, 'line-color': '#0059b3' } }, beforeId);
    // ACTIVE Layer (Visible, styled with traffic)
    mapInstance.addLayer({ id: activeLayerId, type: 'line', source: sourceId, filter: ['==', 'isActive', true], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': 10, 'line-opacity': 0.9, 'line-color': ['match', ['get', 'congestion'], 'low', CONGESTION_COLORS.low, 'moderate', CONGESTION_COLORS.moderate, 'heavy', CONGESTION_COLORS.heavy, 'severe', CONGESTION_COLORS.severe, CONGESTION_COLORS.unknown] } }, beforeId);

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
    const activeRoute = routes?.find((r: EnrichedRoute) => r.isActive);
    if (activeRoute?.geometry?.coordinates && activeRoute.geometry.coordinates.length > 0) {
      const coordinates = activeRoute.geometry.coordinates as mapboxgl.LngLatLike[];
      const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
      coordinates.forEach(coord => bounds.extend(coord));
      
      mapInstance.fitBounds(bounds, {
          // Use constants for fitBounds options
          padding: ROUTE_FIT_BOUNDS_OPTIONS.padding,
          pitch: ROUTE_FIT_BOUNDS_OPTIONS.pitch,
          bearing: mapInstance.getBearing(),
          duration: ROUTE_FIT_BOUNDS_OPTIONS.duration,
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
        const clickedRoute = routes?.find((r: EnrichedRoute) => r.id === clickedRouteId);
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