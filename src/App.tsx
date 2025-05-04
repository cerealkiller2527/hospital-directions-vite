"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { AppHeader, SidebarContainer } from "@/components/Layout"
import { MapProvider, useMap } from "@/contexts/MapContext"
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary"
import type { Hospital } from "@/types/hospital"
import { 
  LAYOUT_DIMENSIONS, 
  DEFAULT_FLY_TO_OPTIONS,
  HOSPITAL_SPECIFIC_VIEWS,
  Z_INDEX,
} from "@/lib/constants";
import mapboxgl from 'mapbox-gl';
import type { CameraOptions } from 'mapbox-gl';
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
        const specificView = HOSPITAL_SPECIFIC_VIEWS[hospital.id] || {};
        
        const targetCenter = specificView.coordinates || hospital.coordinates;
        
        let flyToOptions: CustomFlyToOptions & Pick<CameraOptions, 'zoom' | 'pitch' | 'bearing'> = {
          speed: DEFAULT_FLY_TO_OPTIONS.speed,
          curve: DEFAULT_FLY_TO_OPTIONS.curve,
          zoom: specificView.zoom ?? DEFAULT_FLY_TO_OPTIONS.zoom,
          pitch: specificView.pitch ?? DEFAULT_FLY_TO_OPTIONS.pitch,
          bearing: specificView.bearing ?? mapInstance?.getBearing() ?? 0,
        };

        if (specificView.bearing === undefined && contextUserLocation) {
            try {
            flyToOptions.bearing = calculateBearing(contextUserLocation, targetCenter as [number, number]);
            } catch (error) {
              console.error("Error calculating bearing:", error);
            }
          }
        
        flyTo(targetCenter as [number, number], flyToOptions.zoom, flyToOptions, hospital.id);
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
    currentRoute, handleViewDirections,
    userLocation, getCurrentPosition, geoLoading
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppHeader />
      <div className="relative pt-16 h-screen">
        <SidebarContainer 
          isOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar}
        >
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
