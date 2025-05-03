"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useMap } from '@/contexts/MapContext';
import { useHospitalData } from './useHospitalData';
import { useGeolocation } from './useGeolocation';
import { useDirections } from './useDirections';
import { calculateDistance } from '@/lib/utils';
import { HOSPITAL_STATUS_PRIORITIES } from '@/lib/constants';
import type { Hospital } from '@/types/hospital';
import type { EnrichedRoute } from '@/lib/services/directions';

// Define an extended Hospital type that includes distance
interface HospitalWithDistance extends Hospital {
  distanceMiles?: number | null;
}

// Define the return type for the hook
interface UseAppMapDataReturn {
  // Hospital Data
  allHospitals: Hospital[];
  hospitalsLoading: boolean;
  hospitalsError: string | null;
  processedHospitals: HospitalWithDistance[]; // Sorted and with distance

  // Geolocation Data
  userLocation: [number, number] | null; // Directly from context
  getCurrentPosition: () => void;
  geoLoading: boolean;
  geoError: string | null; // Expose the error string

  // Directions Data
  allRoutes: EnrichedRoute[] | null;
  currentRoute: EnrichedRoute | null;
  directionsLoading: boolean;
  directionsError: string | null;
  selectRoute: (route: EnrichedRoute) => void;
}

/**
 * Hook to manage fetching and processing map-related data 
 * (hospitals, user location, directions).
 */
export function useAppMapData(): UseAppMapDataReturn {
  // --- Get map context data needed for fetching/processing ---
  const { 
    userLocation, 
    setUserLocation, // Need setter for geolocation updates
    selectedLocation, // Needed for directions destination
    transportMode,    // Needed for directions mode
    activeTab         // Needed to determine when to fetch directions
  } = useMap();

  // --- Fetch base hospital data ---
  const { 
    hospitals: baseHospitals, 
    loading: hospitalsLoading, 
    error: hospitalsError 
  } = useHospitalData();

  // --- Manage Geolocation ---
  const { 
    location: geoLoc, 
    loading: geoLoading, 
    error: geoError, 
    getCurrentPosition 
  } = useGeolocation();
  
  // Effect to update userLocation in context when geolocation hook provides it
  useEffect(() => {
    if (geoLoc) {
      setUserLocation(geoLoc);
      // Toast logic will remain in AppContent using the returned geoError/geoLoading
    }
  }, [geoLoc, setUserLocation]);

  // --- Fetch Directions ---
  const { 
    allRoutes, 
    currentRoute, 
    isLoading: directionsLoading, 
    error: directionsError, 
    selectRoute
  } = useDirections(
    userLocation, 
    activeTab === 'directions' ? selectedLocation : null, // Only pass destination if on directions tab
    transportMode
  );

  // --- Process Hospitals (Calculate Distances & Sort) ---
  const processedHospitals = useMemo<HospitalWithDistance[]>(() => {
    const hospitalsArray = Array.isArray(baseHospitals) ? baseHospitals : [];
    
    if (userLocation) {
      // Calculate distances
      const hospitalsWithDistances = hospitalsArray.map(hospital => ({
        ...hospital,
        distanceMiles: calculateDistance(userLocation, hospital.coordinates as [number, number] | undefined)
      }));
      
      // Sort by Status (Open > Unknown > Closed), then by Distance
      return hospitalsWithDistances.sort((a, b) => {
        const getStatusPriority = (status: boolean | undefined): number => {
            if (status === true) return HOSPITAL_STATUS_PRIORITIES.OPEN;
            if (status === undefined) return HOSPITAL_STATUS_PRIORITIES.UNKNOWN;
            return HOSPITAL_STATUS_PRIORITIES.CLOSED;
        };
        
        const priorityA = getStatusPriority(a.isOpen);
        const priorityB = getStatusPriority(b.isOpen);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        if (a.distanceMiles === null) return 1; 
        if (b.distanceMiles === null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });
    } else {
      // No user location, sort alphabetically
      return [...hospitalsArray].sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [baseHospitals, userLocation]);

  // --- Return consolidated state and functions ---
  return {
    // Hospitals
    allHospitals: baseHospitals, // Return the original fetched list
    hospitalsLoading,
    hospitalsError,
    processedHospitals, // Return the sorted list with distances

    // Geolocation
    userLocation, // Pass through from context
    getCurrentPosition,
    geoLoading,
    geoError, // Pass through the error string for toasts

    // Directions
    allRoutes,
    currentRoute,
    directionsLoading,
    directionsError,
    selectRoute,
  };
} 