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
import { HospitalList } from "@/components/map/ui/HospitalList"
import { SearchInput } from "@/components/map/ui/SearchInput"
import { DirectionsCard } from "@/components/map/ui/DirectionsCard"
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
import { useMapInitialization } from "@/lib/hooks/useMapInitialization"; // Import the new hook
import { RouteLayerManager } from "@/components/map/RouteLayerManager"; // Import the manager
import { useDirections } from "@/lib/hooks/useDirections"; // Import the directions hook

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
  const { map: contextMap, setMap, setZoom, selectedLocation } = useMap() // Get context setters

  // Callback for the hook when map loads
  const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
    // --- Add Sky Layer --- (Moved logic here from old effect)
    loadedMap.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
              'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 0.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });
    console.log("Sky layer added via hook callback.");

    // --- Add 3D buildings layer --- (Moved logic here from old effect)
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
    loadedMap.addLayer(
            {
              'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
          'fill-extrusion-color': '#aac7e9',
                'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0, 15.5, ['get', 'height']
                ],
                'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0, 15.5, ['get', 'min_height']
                ],
          'fill-extrusion-opacity': 0.8
              }
            },
      firstSymbolId
          );
    console.log("3D buildings layer added via hook callback.");

    // Set the map instance in the context
    setMap(loadedMap);

  }, [setMap]); // Dependency on setMap

  // Callback for the hook on zoom changes
  const handleMapZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, [setZoom]);

  // Use the initialization hook
  const initializedMap = useMapInitialization({
    containerRef: mapContainerRef,
    onLoad: handleMapLoad,
    onZoom: handleMapZoom,
    logCameraParams: true // Enable logging for debugging
  });

  // Keep the effect for resizing on selection change
  useEffect(() => {
    // Use the map instance from the context for resize
    contextMap?.resize()
  }, [contextMap, selectedLocation])

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

  // LIFT search state here
  const [searchQuery, setSearchQuery] = useState("");

  // Setup search hook to ONLY filter based on lifted state
  const { filteredHospitals } = useHospitalSearch(allHospitals, searchQuery) // Pass searchQuery

  const {
    map: mapInstance,
    selectedLocation, setSelectedLocation,
    popupLocation, setPopupLocation,
    userLocation, setUserLocation,
    flyTo, transportMode,
    setAnimatingMarkerId
  } = useMap()
  const { location: geoLoc, loading: geoLoading, error: geoError, getCurrentPosition } = useGeolocation()

  // --- Use the Directions Hook --- 
  const { 
    allRoutes, 
    currentRoute, 
    isLoading: directionsLoading, 
    error: directionsError, 
    selectRoute // Get the selectRoute function from the hook
  } = useDirections(
    userLocation, 
    // Only pass destination if directions tab is active
    activeTab === 'directions' ? selectedLocation : null, 
    transportMode
  );

  // Update map context when geolocation hook provides location
  useEffect(() => {
    if (geoLoc) {
      setUserLocation(geoLoc)
    }
  }, [geoLoc, setUserLocation]) // Dependency array corrected

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
          // Pass hospital ID
          flyTo([-71.167169, 42.323224], flyToOptions.zoom, flyToOptions, hospital.id);
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
          // Pass hospital ID
          flyTo(hospital.coordinates as [number, number], flyToOptions.zoom, flyToOptions, hospital.id);
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
  
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
    setTimeout(() => {
      mapInstance?.resize()
    }, 300) 
  }, [mapInstance])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("") // Use the lifted setter
  }, [setSearchQuery]) // Update dependency

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
              isLoading={directionsLoading}
              error={directionsError}
              allRoutes={allRoutes}
              onSelectRoute={selectRoute}
            />
          </TabsContent>
        </Tabs>
      </div>
    ),
    [searchQuery, setSearchQuery, handleMyLocationClick, geoLoading, geoError, activeTab, filteredHospitals, handleClearSearch, selectedLocation, allRoutes, directionsLoading, directionsError, hospitalsLoading, hospitalsError, handleViewDirections, handleSelectHospitalFromList, selectRoute]
  )

  return (
      <div className="relative min-h-screen overflow-hidden">
        <AppHeader 
          isSidebarOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
      <div className="relative pt-16 h-screen">
        <SidebarContainer isOpen={sidebarOpen}>{sidebarContent}</SidebarContainer>
        <div className="absolute top-16 bottom-0 left-0 right-0" style={{ zIndex: Z_INDEX.base }}>
          <MainMap /> 
          <RouteLayerManager routes={allRoutes} onSelectRoute={selectRoute} />
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
