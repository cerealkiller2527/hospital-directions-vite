"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, Dispatch, SetStateAction } from "react"
import type { Hospital, TransportMode } from "@/types/hospital"
import type mapboxgl from 'mapbox-gl';
import { DEFAULT_MAP_VIEW } from '@/lib/mapbox';
// Remove calculateBearing import
// import { calculateBearing } from '@/lib/utils';
// Remove constants imports
// import {
//   DEFAULT_FLY_TO_OPTIONS, 
//   CHESTNUT_HILL_VIEW_PARAMS, 
// } from '@/lib/constants'; 

// Define the type alias here if not already globally available
type CustomFlyToOptions = Omit<mapboxgl.CameraOptions & mapboxgl.AnimationOptions, 'center' | 'zoom'>;

// Define possible tab values
type ActiveMapTab = "list" | "directions" | "indoor";

interface MapContextType {
  selectedLocation: Hospital | null
  setSelectedLocation: Dispatch<SetStateAction<Hospital | null>>
  popupLocation: Hospital | null
  setPopupLocation: Dispatch<SetStateAction<Hospital | null>>
  animatingMarkerId: number | null
  setAnimatingMarkerId: Dispatch<SetStateAction<number | null>>
  transportMode: TransportMode
  setTransportMode: Dispatch<SetStateAction<TransportMode>>
  zoom: number
  setZoom: Dispatch<SetStateAction<number>>
  map: mapboxgl.Map | null;
  setMap: Dispatch<SetStateAction<mapboxgl.Map | null>>;
  userLocation: [number, number] | null;
  setUserLocation: Dispatch<SetStateAction<[number, number] | null>>;
  activeTab: ActiveMapTab;
  setActiveTab: Dispatch<SetStateAction<ActiveMapTab>>;
  // Derived state for convenience
  isMinZoom: boolean
  isMaxZoom: boolean
  // Methods
  zoomIn: () => void
  zoomOut: () => void
  flyTo: (center: [number, number], zoomLevel?: number, options?: CustomFlyToOptions, hospitalId?: number) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}

interface MapProviderProps {
  children: ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  const [selectedLocation, setSelectedLocation] = useState<Hospital | null>(null);
  const [popupLocation, setPopupLocation] = useState<Hospital | null>(null);
  const [animatingMarkerId, setAnimatingMarkerId] = useState<number | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("drive");
  const [zoom, setZoom] = useState(DEFAULT_MAP_VIEW.zoom);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveMapTab>("list");

  const isMinZoom = zoom <= DEFAULT_MAP_VIEW.minZoom;
  const isMaxZoom = zoom >= DEFAULT_MAP_VIEW.maxZoom;

  const zoomIn = useCallback(() => {
    map?.zoomIn();
  }, [map]);

  const zoomOut = useCallback(() => {
    map?.zoomOut();
  }, [map]);

  // Simplify flyTo: Remove specific logic, just pass parameters
  const flyTo = useCallback((center: [number, number], zoomLevel?: number, options?: CustomFlyToOptions, hospitalId?: number /* Keep hospitalId maybe for future use? */) => {
    if (!map) return;
    
    // Basic flyTo call - complexity is handled in App.tsx/LocationMarker.tsx
    map.flyTo({
      center: center,
      zoom: zoomLevel ?? map.getZoom(), // Use provided zoom or current zoom
      ...(options || {}) // Spread any provided options (pitch, bearing, speed, curve)
    });

  }, [map]); // Only depends on map instance now

  const value = {
    selectedLocation,
    setSelectedLocation,
    popupLocation,
    setPopupLocation,
    animatingMarkerId,
    setAnimatingMarkerId,
    transportMode,
    setTransportMode,
    zoom,
    setZoom,
    map,
    setMap,
    userLocation,
    setUserLocation,
    activeTab,
    setActiveTab,
    isMinZoom,
    isMaxZoom,
    zoomIn,
    zoomOut,
    flyTo,
  }

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
} 