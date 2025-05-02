"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useHospitalData } from "@/lib/hooks/useHospitalData"
import { useHospitalSearch } from "@/lib/hooks/useHospitalSearch"
import { useGeolocation } from "@/lib/hooks/useGeolocation"
import { AppHeader, SidebarContainer } from "@/components/Layout"
import { MapProvider, useMap } from "@/contexts/MapContext"
import { MapControls } from "@/components/map/MapControls"
import { LocationMarker } from "@/components/map/LocationMarker"
import { LocationPopup } from "@/components/map/LocationPopup"
import { UserLocationMarker } from "@/components/map/UserLocationMarker"
import { HospitalList, SearchInput, DirectionsCard } from "@/components/map/MapUIComponents"
import { initializeMap } from "@/lib/services/mapbox-service"
import { MAP_STYLE, DEFAULT_MAP_VIEW } from "@/lib/mapbox"
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary"
import { getDirections, type EnrichedRoute } from "@/lib/services/directions"
import type { Directions, Hospital } from "@/types/hospital"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Z_INDEX } from "@/lib/constants";
import mapboxgl from 'mapbox-gl';
// Import GeoJSON types if available (assuming @types/geojson is installed)
import type { FeatureCollection, Feature, LineString, Point } from 'geojson'; 
// Import turf helpers for distance calculation
import * as turf from '@turf/turf';
// Import specific icons needed for mapping 
import {
  Hospital as HospitalIcon, 
  Stethoscope,
  HeartPulse,
  Activity,
  SquareUserRound,
  Navigation,
  Loader2
} from "lucide-react";

// Mock directions for now until API integration
const mockDirections: Directions = {
  steps: [
    {
      instruction: "Start at your location",
      distance: "0 miles",
      duration: "0 min",
    },
    {
      instruction: "Proceed to the destination",
      distance: "Varies",
      duration: "Varies",
    },
  ],
  distance: "N/A",
  duration: "N/A",
}

// Define congestion colors
const congestionColors: Record<string, string> = {
  low: '#66cdaa',      // Medium Aquamarine (Greenish)
  moderate: '#ffa500',  // Orange
  heavy: '#ff4500',    // Orange Red
  severe: '#b22222',  // Firebrick (Dark Red)
  unknown: '#a0aec0', // Gray (fallback for missing/unknown)
};

// Define mapping from Hospital ID to Lucide icon name (string)
const hospitalIconMapping: Record<number, string> = {
  0: "hospital", // Main Campus
  1: "square-user-round", // Chestnut Hill
  2: "activity", // Patriot Place
  3: "stethoscope", // 22 Patriot Place
  4: "heart-pulse", // Faulkner
};

// Define the combined type for flyTo options
type CustomFlyToOptions = Omit<mapboxgl.CameraOptions & mapboxgl.AnimationOptions, 'center'>;

// Main Map Component
function MainMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { map, setMap, setZoom, selectedLocation } = useMap()

  useEffect(() => {
    let initializedMapInstance: mapboxgl.Map | null = null;
    let logCameraParamsHandler: (() => void) | null = null;

    if (!map && mapContainerRef.current) { // Check if map needs initialization
      initializedMapInstance = initializeMap(mapContainerRef.current, {
      style: MAP_STYLE,
      center: DEFAULT_MAP_VIEW.center as [number, number],
      zoom: DEFAULT_MAP_VIEW.zoom,
      minZoom: DEFAULT_MAP_VIEW.minZoom,
      maxZoom: DEFAULT_MAP_VIEW.maxZoom,
        pitch: DEFAULT_MAP_VIEW.pitch,
        bearing: DEFAULT_MAP_VIEW.bearing,
      renderWorldCopies: false
    })

      if (initializedMapInstance) {
        // Define the handler using the instance from this scope
        logCameraParamsHandler = () => {
          if (!initializedMapInstance) return; // Guard
          const center = initializedMapInstance.getCenter();
          const zoom = initializedMapInstance.getZoom();
          const pitch = initializedMapInstance.getPitch();
          const bearing = initializedMapInstance.getBearing();
          console.log('Map Camera Parameters:',
            `\n  Center: [${center.lng.toFixed(6)}, ${center.lat.toFixed(6)}]`,
            `\n  Zoom: ${zoom.toFixed(2)}`,
            `\n  Pitch: ${pitch.toFixed(2)}`,
            `\n  Bearing: ${bearing.toFixed(2)}`
          );
        };

        initializedMapInstance.on('load', () => {
          if (!initializedMapInstance) return; // Guard
          setMap(initializedMapInstance);
          console.log("Map loaded.");

          // --- Add Sky Layer ---
          initializedMapInstance.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 0.0], // Sun position [azimuth, altitude] - adjust as needed
              'sky-atmosphere-sun-intensity': 15
            }
          });
          console.log("Sky layer added.");

          // --- Add 3D buildings layer --- 
          const layers = initializedMapInstance.getStyle().layers;
          let firstSymbolId;
          if (layers) {
            for (const layer of layers) {
                if (layer.type === 'symbol') {
                    firstSymbolId = layer.id;
                    break;
                }
            }
          }
          
          initializedMapInstance.addLayer(
            {
              'id': '3d-buildings',
              'source': 'composite', // Default source for Mapbox styles
              'source-layer': 'building', // Standard building layer
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': '#aac7e9', // Accent color
                // Use feature properties for height
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15, 0, // Start flat at zoom 15
                  15.5, ['get', 'height'] // Extrude based on height property
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15, 0,
                  15.5, ['get', 'min_height'] // Base height if available
                ],
                'fill-extrusion-opacity': 0.8 // Set opacity
              }
            },
            firstSymbolId // Place before labels/symbols
          );
          console.log("3D buildings layer added.");

          // Initial resize
          initializedMapInstance.resize()
        })

        initializedMapInstance.on('zoom', () => {
          if (!initializedMapInstance) return; // Guard
          setZoom(initializedMapInstance.getZoom())
        })
         
        // Add listener using the handler defined above
        if (logCameraParamsHandler) {
          initializedMapInstance.on('moveend', logCameraParamsHandler);
        }
      }
    }

    // Cleanup function
    return () => {
      if (initializedMapInstance) {
        // Remove listener using the stored handler reference
        if (logCameraParamsHandler) {
           try { // Add try-catch for safety during unmount
             initializedMapInstance.off('moveend', logCameraParamsHandler);
           } catch (error) {
             console.warn("Error removing moveend listener:", error);
           }
        }
        try {
          initializedMapInstance.remove();
        } catch (error) {
           console.warn("Error removing map instance:", error);
        }
      }
      setMap(null);
    };
  // Adjust dependencies as needed, map state is handled internally now
  }, [setMap, setZoom]); 

  // Resize map when location selection changes (to ensure it fits)
  useEffect(() => {
    map?.resize()
  }, [map, selectedLocation])

  return (
    <div ref={mapContainerRef} className="absolute inset-0" style={{ zIndex: Z_INDEX.map }} data-testid="main-map-container" />
  )
}

// App Content Component
function AppContent() {
  const [activeTab, setActiveTab] = useState<"list" | "directions">("list")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Fetch hospital data
  const { hospitals: allHospitals, loading: hospitalsLoading, error: hospitalsError } = useHospitalData()

  // Setup search based on fetched data
  const { filteredHospitals, searchQuery, setSearchQuery } = useHospitalSearch(allHospitals)

  const {
    map: mapInstance,
    selectedLocation, setSelectedLocation,
    popupLocation, setPopupLocation,
    userLocation, setUserLocation,
    flyTo, transportMode,
    setAnimatingMarkerId
  } = useMap()
  const { location: geoLoc, loading: geoLoading, error: geoError, getCurrentPosition } = useGeolocation()

  // State for directions
  const [allRoutes, setAllRoutes] = useState<EnrichedRoute[] | null>(null); // Holds all fetched routes
  const [currentRoute, setCurrentRoute] = useState<EnrichedRoute | null>(null); // Holds the currently displayed route
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  // Add state to track hovered route ID for map interaction
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

  // Update map context when geolocation hook provides location
  useEffect(() => {
    if (geoLoc) {
      setUserLocation(geoLoc)
    }
  }, [geoLoc, setUserLocation]) // Dependency array corrected

  // Fetch directions when conditions are met
  useEffect(() => {
    if (activeTab === 'directions' && selectedLocation?.coordinates && userLocation) {
      const fetchRoute = async () => {
        // Clear previous routes *before* starting new fetch
        setAllRoutes(null);
        setCurrentRoute(null);
        setDirectionsError(null);
        setDirectionsLoading(true);
        try {
          const routesData = await getDirections(userLocation, selectedLocation.coordinates as [number, number], transportMode);
          console.log("Fetched Routes Data:", routesData); // Log #1 (array)
          if (routesData && routesData.length > 0) {
            setAllRoutes(routesData); // Store all routes
            setCurrentRoute(routesData[0]); // Set the first route as current initially
            console.log("Setting allRoutes and currentRoute (first):"); // Log #2
          } else {
            setDirectionsError("Could not calculate directions for the selected mode.");
            setAllRoutes(null);
            setCurrentRoute(null);
          }
        } catch (err) {
          setDirectionsError("Failed to fetch directions.");
          setAllRoutes(null);
          setCurrentRoute(null);
          console.error(err);
        } finally {
          setDirectionsLoading(false);
        }
      };
      fetchRoute();
    } else {
      // If conditions are NOT met, clear the routes.
      if (currentRoute !== null || allRoutes !== null) { 
         setAllRoutes(null); // Clear all routes
         setCurrentRoute(null); // Clear current route
         setDirectionsError(null);
         setDirectionsLoading(false);
         console.log("Effect: Conditions not met, clearing route state.");
      }
    }
  }, [activeTab, selectedLocation, userLocation, transportMode]); // Dependencies are correct

  // --- Helper to create GeoJSON FeatureCollection from routes ---
  const createRoutesGeoJSON = useCallback((routes: EnrichedRoute[] | null): FeatureCollection => {
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
              routeId: routeId, // Store original route ID
              isActive: isActive, // Store active status
              congestion: segmentCongestion, // Store segment congestion
              // Add original duration/distance if needed for popups, but maybe not necessary
              // parentDuration: route.directions.duration,
              // parentDistance: route.directions.distance,
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
  }, []);

  // --- Handlers need to be defined before effects that use them ---
  
  // Function to handle list item clicks
  const handleSelectHospitalFromList = useCallback((hospital: Hospital) => {
    setSelectedLocation(hospital); 
    setPopupLocation(null);        
    setAnimatingMarkerId(hospital.id);
    if (hospital.coordinates) {
        // Use the defined type alias
        let flyToOptions: CustomFlyToOptions = {
          pitch: 70, 
          speed: 1.8,
          bearing: mapInstance?.getBearing() ?? 0, 
          zoom: 18 // Set default zoom to 18
        };

        if (hospital.id === 1) {
          flyToOptions = {
            ...flyToOptions,
            // No center here
            zoom: 19.56, 
            pitch: 71.00,
            bearing: 16.00,
          };
          // Use specific center for ID 1
          flyTo([-71.167169, 42.323224], flyToOptions.zoom, flyToOptions);
        } else {
          if (userLocation) { 
             try {
              const startPoint = turf.point(userLocation);
              const endPoint = turf.point(hospital.coordinates as [number, number]);
              flyToOptions.bearing = turf.bearing(startPoint, endPoint);
            } catch (error) {
              console.error("Error calculating bearing:", error);
            }
          }
          // Use hospital's coordinates for others, using the default zoom (18) set above
          flyTo(hospital.coordinates as [number, number], flyToOptions.zoom, flyToOptions);
        }
    }
  }, [setSelectedLocation, setPopupLocation, setAnimatingMarkerId, flyTo, userLocation, mapInstance]);

  // Function to handle directions button clicks (from list or popup)
  const handleViewDirections = useCallback((hospital: Hospital) => {
    setSelectedLocation(hospital); // Selects the hospital (updates layer style)
    setPopupLocation(null); // Close popup if open       
    setAnimatingMarkerId(null); // RE-ADD: Stop animation when viewing directions
    setActiveTab("directions");    
  }, [setSelectedLocation, setPopupLocation, setAnimatingMarkerId, setActiveTab]);
  
  // Handler for selecting an alternative route (Moved BEFORE interaction effect)
  const handleSelectRoute = useCallback((route: EnrichedRoute) => {
    setCurrentRoute(route);
    // Update isActive flags
    setAllRoutes(prevRoutes => 
      prevRoutes?.map(r => ({ ...r, isActive: r.id === route.id })) || null
    );
  }, [setCurrentRoute, setAllRoutes]);

  // --- Map Effects --- 

  // Effect to INITIALIZE Route Source and Layers (runs once)
  useEffect(() => {
    if (!mapInstance || mapInstance.getSource('routes-source')) return;

    mapInstance.addSource('routes-source', {
      type: 'geojson',
      data: createRoutesGeoJSON(null) // Initialize empty
    });

    const beforeId = 'road-label';
    
    // --- Casings (for interaction hitbox) ---
    
    // INACTIVE Casing (Invisible, wide)
    mapInstance.addLayer({
      id: 'routes-inactive-casing',
      type: 'line',
      source: 'routes-source',
      filter: ['==', 'isActive', false],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': 15, // Large width for hitbox
        'line-opacity': 0, // Fully transparent
        'line-color': '#000000' // Color doesn't matter
      }
    }, beforeId); 

    // ACTIVE Casing (Invisible, wide)
    mapInstance.addLayer({
      id: 'routes-active-casing',
      type: 'line',
      source: 'routes-source',
      filter: ['==', 'isActive', true],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': 15, // Large width for hitbox
        'line-opacity': 0, // Fully transparent
        'line-color': '#000000' // Color doesn't matter
      }
    }, beforeId);

    // --- Visible Layers (Rendered on top of casings) ---
    
    // Layer for INACTIVE routes (Visible, styled)
    mapInstance.addLayer({
      id: 'routes-inactive',
      type: 'line',
      source: 'routes-source',
      filter: ['==', 'isActive', false],
      layout: { 'line-join': 'round', 'line-cap': 'round' }, 
      paint: {
        'line-width': 8, 
        'line-opacity': 0.6, 
        'line-color': '#0059b3', 
      }
    }, beforeId); // Rendered after inactive casing, before active casing

    // Layer for ACTIVE route (Visible, styled with traffic)
    mapInstance.addLayer({
      id: 'routes-active',
      type: 'line',
      source: 'routes-source',
      filter: ['==', 'isActive', true],
      layout: { 'line-join': 'round', 'line-cap': 'round' }, 
      paint: {
        'line-width': 8, 
        'line-opacity': 0.9,
        'line-color': [
          'match',
          ['get', 'congestion'],
          'low', '#0059b3',
          'moderate', congestionColors.moderate,
          'heavy', congestionColors.heavy,
          'severe', congestionColors.severe,
          /* unknown */ '#0059b3' // Dark primary blue fallback
        ]
      }
    }, beforeId); // Rendered after active casing, before labels
    
    console.log("Effect: Initialized routes-source and layers (segmented + casings).");

  }, [mapInstance, createRoutesGeoJSON]);

  // Effect to UPDATE Route Data in Source (runs when allRoutes changes)
  useEffect(() => {
    if (!mapInstance) return;
    const source = mapInstance.getSource('routes-source') as mapboxgl.GeoJSONSource;
    if (!source) {
        console.log("Effect: Update routes - source doesn't exist yet.");
        return; 
    }

    const geojsonData = createRoutesGeoJSON(allRoutes);
    source.setData(geojsonData);
    console.log("Effect: Updated routes-source data.");

    // Fit Bounds to the ACTIVE route when routes are loaded/changed
    const activeRoute = allRoutes?.find(r => r.isActive);
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

  }, [mapInstance, allRoutes, createRoutesGeoJSON]); // Depend on allRoutes

  // --- Effect to Handle Route Layer Interactions --- 
  useEffect(() => {
    if (!mapInstance) return;

    // Target the CASING layers for interaction
    const routeLayers = ['routes-active-casing', 'routes-inactive-casing'];

    // Mouse Enter
    const handleMouseEnter = (e: mapboxgl.MapLayerMouseEvent) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
      if (e.features && e.features.length > 0) {
         // Get routeId from the segment feature's properties
         const hoveredRouteId = e.features[0].properties?.routeId; 
         if (hoveredRouteId) {
           setHoveredRouteId(hoveredRouteId); // Set state based on parent route ID
         }
      }
    };

    // Mouse Leave
    const handleMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = '';
      setHoveredRouteId(null);
    };

    // Click
    const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        // Get routeId from the segment feature's properties
        const clickedRouteId = e.features[0].properties?.routeId;
        // Find the original route object using the routeId
        const clickedRoute = allRoutes?.find(r => r.id === clickedRouteId);
        if (clickedRoute) {
          handleSelectRoute(clickedRoute);
        }
      }
    };

    // Attach listeners to CASING layers
    routeLayers.forEach(layerId => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.on('mouseenter', layerId, handleMouseEnter);
        mapInstance.on('mouseleave', layerId, handleMouseLeave);
        mapInstance.on('click', layerId, handleClick);
    } else {
        console.warn(`Layer ${layerId} not found for attaching listeners.`);
      }
    });

    // Cleanup listeners from CASING layers
    return () => {
      if (mapInstance && mapInstance.getStyle()) { // Check if map still exists
        routeLayers.forEach(layerId => {
          if (mapInstance.getLayer(layerId)) { 
              mapInstance.off('mouseenter', layerId, handleMouseEnter);
              mapInstance.off('mouseleave', layerId, handleMouseLeave);
              mapInstance.off('click', layerId, handleClick);
          }
        });
      }
    };

  }, [mapInstance, allRoutes, handleSelectRoute]); // Dependencies correct

  // Effect to handle clicks on the map background to deselect
  useEffect(() => {
    if (!mapInstance) return;
    const handleMapClick = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
      if (mapInstance.isMoving()) return; // Don't deselect if map is animating
      
      const targetElement = e.originalEvent.target;
      if (targetElement instanceof Element && targetElement.closest('.marker-dom-element')) {
        return; 
      }
      // Only clear popup and animation, leave selectedLocation as is
      // setSelectedLocation(null); // REMOVED: Don't deselect on map click
      setPopupLocation(null);   
      setAnimatingMarkerId(null);
    };
    mapInstance.on('click', handleMapClick);
    return () => {
       if (mapInstance && mapInstance.getStyle()) {
         mapInstance.off('click', handleMapClick);
       }
    };
  }, [mapInstance, setPopupLocation, setAnimatingMarkerId]); 

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
    setTimeout(() => {
      mapInstance?.resize()
    }, 300) 
  }, [mapInstance])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [setSearchQuery])

  const handleMyLocationClick = useCallback(() => {
    if (userLocation) {
      // Use maxZoom and increase pitch
      flyTo(userLocation, DEFAULT_MAP_VIEW.maxZoom, { pitch: 85, speed: 1.8 }); 
    } else {
      getCurrentPosition()
    }
  }, [userLocation, getCurrentPosition, flyTo]); // Added flyTo dependency

  const sidebarContent = useMemo(
    () => (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 space-y-4 mb-4 px-1">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search hospitals..." />

          <Button
            size="sm"
            className="h-10 gap-1 w-full text-sm flex-shrink-0"
            onClick={handleMyLocationClick}
            disabled={geoLoading}
          >
            <Navigation className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{geoLoading ? 'Finding...' : 'My Location'}</span>
          </Button>
          {geoError && <p className="text-xs text-red-600 text-center">{geoError}</p>}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "list" | "directions")}
          className="flex flex-col flex-1 h-0 min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 h-9 flex-shrink-0 mb-2">
            <TabsTrigger value="list" className="text-xs">List View</TabsTrigger>
            <TabsTrigger value="directions" className="text-xs">Directions</TabsTrigger>
          </TabsList>
          <TabsContent 
            value="list" 
            className="flex-1 h-0 min-h-0 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden"
          >
            {hospitalsLoading ? (
              <div className="space-y-2 p-1">
                <Skeleton className="h-[100px] w-full" />
                <Skeleton className="h-[100px] w-full" />
                <Skeleton className="h-[100px] w-full" />
              </div>
            ) : hospitalsError ? (
              <div className="text-center py-8 text-sm text-red-600">{hospitalsError}</div>
            ) : (
              <div className="flex-1 h-0 min-h-0 overflow-y-auto lowprofile-scrollbar">
                <HospitalList
                  hospitals={filteredHospitals}
                  searchQuery={searchQuery}
                  onClearSearch={handleClearSearch}
                  onSelectItem={handleSelectHospitalFromList}
                  onViewDirections={handleViewDirections}
                  iconMapping={hospitalIconMapping}
                />
              </div>
            )}
          </TabsContent>
          <TabsContent 
            value="directions" 
            className="flex-1 h-0 min-h-0 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden overflow-hidden"
          >
            <DirectionsCard
              hospital={selectedLocation}
              directions={currentRoute?.directions ?? null}
              isLoading={directionsLoading}
              error={directionsError}
              allRoutes={allRoutes}
              onSelectRoute={handleSelectRoute}
            />
          </TabsContent>
        </Tabs>
      </div>
    ),
    [searchQuery, setSearchQuery, handleMyLocationClick, geoLoading, geoError, activeTab, filteredHospitals, handleClearSearch, selectedLocation, currentRoute, allRoutes, directionsLoading, directionsError, hospitalsLoading, hospitalsError, handleViewDirections, handleSelectHospitalFromList, handleSelectRoute]
  )

  return (
      <div className="relative min-h-screen overflow-hidden">
        <AppHeader isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="relative pt-16 h-screen">
        <SidebarContainer isOpen={sidebarOpen}>{sidebarContent}</SidebarContainer>
        <div className="absolute top-16 bottom-0 left-0 right-0" style={{ zIndex: Z_INDEX.base }}>
          <MainMap /> 
          {!hospitalsLoading && allHospitals.map((hospital) =>
            hospital.coordinates ? (
              <LocationMarker
                key={hospital.id}
                hospital={hospital}
                iconName={hospitalIconMapping[hospital.id] || 'hospital'}
              />
            ) : null
          )}
          <UserLocationMarker />
          {popupLocation && (
            <LocationPopup 
              location={popupLocation} 
              onViewDirections={handleViewDirections} 
              iconName={hospitalIconMapping[popupLocation.id] || 'hospital'}
            />
          )}
          <MapControls />
        </div>
      </div>
    </div>
  )
}

// Main App component wrapped with Provider and ErrorBoundary
export default function App() {
  return (
    <MapErrorBoundary fallback={<p>Map failed to load. Please refresh.</p>}> 
      <MapProvider>
        <AppContent />
    </MapProvider>
    </MapErrorBoundary>
  )
}
