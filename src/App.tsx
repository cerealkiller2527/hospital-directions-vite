"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { AppHeader, SidebarContainer } from "@/components/Layout"
import { MapProvider, useMap } from "@/contexts/MapContext"
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary"
import type { Hospital } from "@/types/hospital"
import {
  LAYOUT_DIMENSIONS,
  DEFAULT_FLY_TO_OPTIONS,
  Z_INDEX,
  HOSPITAL_CUSTOM_VIEWS,
} from "@/lib/constants";
import mapboxgl from 'mapbox-gl';
import {
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { RouteLayerManager } from "@/components/map/RouteLayerManager";
import { useAppMapData } from "@/lib/hooks/useAppMapData";
import { calculateBearing } from '@/lib/utils';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MainMap } from "@/components/MainMap";
import { SidebarContent, type SidebarContentProps } from "@/components/SidebarContent";
import { MapElements, type MapElementsProps } from "@/components/MapElements";

type CustomFlyToOptions = Omit<mapboxgl.CameraOptions & mapboxgl.AnimationOptions, 'center'>;

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const {
    map: mapInstance,
    selectedLocation, setSelectedLocation,
    popupLocation, setPopupLocation,
    flyTo,
    setAnimatingMarkerId,
    activeTab, setActiveTab,
    userLocation: contextUserLocation,
  } = useMap()

  const {
    hospitalsLoading,
    hospitalsError,
    processedHospitals,
    userLocation,
    getCurrentPosition,
    geoLoading,
    geoError,
    allRoutes,
    currentRoute,
    directionsLoading,
    directionsError,
    selectRoute
  } = useAppMapData();

  const locationToastShownRef = useRef(false);

  useEffect(() => {
    if (!geoLoading && userLocation && !locationToastShownRef.current) {
       toast.success("Your location has been updated.", {
         icon: <CheckCircle className="h-4 w-4" />,
       });
       locationToastShownRef.current = true;
    }
    if (!userLocation) {
        locationToastShownRef.current = false;
    }
  }, [geoLoading, userLocation]);

  useEffect(() => {
    if (geoError) {
      toast.error(geoError, {
        icon: <AlertTriangle className="h-4 w-4" />,
      });
      locationToastShownRef.current = false;
    }
  }, [geoError]);

  useEffect(() => {
    if (activeTab === 'directions' && !selectedLocation) {
      toast.info("Please select a hospital from the list or map to view directions.", {
        icon: <Info className="h-4 w-4" />,
      });
    }
  }, [activeTab, selectedLocation]);

  const handleSelectHospitalFromList = useCallback((hospital: Hospital) => {
    setSelectedLocation(hospital);
    setPopupLocation(null);
    setAnimatingMarkerId(hospital.id);
    
    if (hospital.coordinates) {
        // Get custom view options or fallback to defaults
        const customView = HOSPITAL_CUSTOM_VIEWS[hospital.id] || {};
        const defaultOptions = DEFAULT_FLY_TO_OPTIONS; // For easier access

        let flyToOptions: CustomFlyToOptions & { center: [number, number]; zoom: number } = {
          // Base options from defaults
          pitch: defaultOptions.pitch,
          speed: defaultOptions.speed,
          curve: defaultOptions.curve,
          bearing: mapInstance?.getBearing() ?? defaultOptions.bearing,
          zoom: defaultOptions.zoom,
          center: hospital.coordinates as [number, number], // Default center to hospital coords
          
          // Override with custom view settings if they exist
          ...customView, 
        };
        
        // Use custom coordinates if provided, otherwise stick to hospital's
        if (customView.coordinates) {
            flyToOptions.center = customView.coordinates;
        }

        // Override bearing only if not explicitly set in custom view
        if (contextUserLocation && customView.bearing === undefined) {
          try {
            flyToOptions.bearing = calculateBearing(contextUserLocation, flyToOptions.center);
          } catch (error) {
            console.error("Error calculating bearing:", error);
          }
        }
        
        // Call flyTo with the constructed options
        flyTo(flyToOptions.center, flyToOptions.zoom, flyToOptions, hospital.id);
    }
  }, [setSelectedLocation, setPopupLocation, setAnimatingMarkerId, flyTo, contextUserLocation, mapInstance]);

  const handleViewDirections = useCallback((hospital: Hospital) => {
    setSelectedLocation(hospital);
    setPopupLocation(null);
    setAnimatingMarkerId(null);
    setActiveTab("directions");
  }, [setSelectedLocation, setPopupLocation, setAnimatingMarkerId, setActiveTab]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
    setTimeout(() => {
      mapInstance?.resize()
    }, LAYOUT_DIMENSIONS.SIDEBAR_TRANSITION_MS)
  }, [mapInstance])

  const sidebarProps: SidebarContentProps = {
    getCurrentPosition, geoLoading, geoError, activeTab, setActiveTab,
    processedHospitals, selectedLocation, allRoutes, directionsLoading,
    directionsError, hospitalsLoading, hospitalsError, handleViewDirections,
    handleSelectHospitalFromList, selectRoute
  };

  const mapElementsProps: MapElementsProps = {
    mapInstance, hospitalsLoading, processedHospitals, popupLocation,
    currentRoute, handleViewDirections
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="relative pt-16 h-screen">
        <SidebarContainer isOpen={sidebarOpen}>
           <SidebarContent {...sidebarProps} />
        </SidebarContainer>
        <div className="absolute top-16 bottom-0 left-0 right-0" style={{ zIndex: Z_INDEX.map }}>
          <MainMap />
          <RouteLayerManager routes={allRoutes} onSelectRoute={selectRoute} />
          <MapElements {...mapElementsProps} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <MapErrorBoundary fallback={<p>Map failed to load. Please refresh.</p>}>
      <MapProvider>
        <AppContent />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: { marginTop: `${LAYOUT_DIMENSIONS.HEADER_HEIGHT + 8}px` },
          }}
        />
    </MapProvider>
    </MapErrorBoundary>
  )
}
