"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, Dispatch, SetStateAction } from "react"
import type { Hospital, TransportMode } from "@/types/hospital"
import type mapboxgl from 'mapbox-gl';
import { DEFAULT_MAP_VIEW } from '@/lib/mapbox';
import * as turf from '@turf/turf'; // Import turf for bearing calculation

// Define the type alias here if not already globally available
type CustomFlyToOptions = Omit<mapboxgl.CameraOptions & mapboxgl.AnimationOptions, 'center' | 'zoom'>;

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

  const isMinZoom = zoom <= DEFAULT_MAP_VIEW.minZoom;
  const isMaxZoom = zoom >= DEFAULT_MAP_VIEW.maxZoom;

  const zoomIn = useCallback(() => {
    map?.zoomIn();
  }, [map]);

  const zoomOut = useCallback(() => {
    map?.zoomOut();
  }, [map]);

  const flyTo = useCallback((center: [number, number], zoomLevel?: number, options?: CustomFlyToOptions, hospitalId?: number) => {
    if (!map) return;
    
    let finalCenter: [number, number] = center;
    let finalZoom: number = zoomLevel ?? map.getZoom();
    let finalOptions: mapboxgl.CameraOptions & mapboxgl.AnimationOptions = {
      pitch: options?.pitch ?? 70,
      speed: options?.speed ?? 1.8,
      curve: options?.curve ?? 1.42,
      bearing: options?.bearing ?? map.getBearing(),
      ...options 
    };

    // Special Case for Chestnut Hill (ID 1)
    if (hospitalId === 1) {
      finalCenter = [-71.167169, 42.323224];
      finalZoom = 19.56;
      finalOptions = { ...finalOptions, pitch: 71.00, bearing: 16.00 }; 
    } else {
      // Bearing Calculation for non-special cases
      if (userLocation && options?.bearing === undefined) { 
         try {
          const startPoint = turf.point(userLocation);
          const endPoint = turf.point(finalCenter);
          finalOptions.bearing = turf.bearing(startPoint, endPoint);
        } catch (error) {
          console.error("Error calculating bearing:", error);
          finalOptions.bearing = map.getBearing();
        }
      }
    }

    map.flyTo({ 
      center: finalCenter, 
      zoom: finalZoom,
      ...finalOptions
    });

  }, [map, userLocation]); // Include userLocation dependency

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
    isMinZoom,
    isMaxZoom,
    zoomIn,
    zoomOut,
    flyTo,
  }

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
} 