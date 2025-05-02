import { useState, useEffect } from 'react';
import type { Hospital } from '@/types/hospital';
import { baseHospitalData } from '@/lib/constants'; // Using constants directly
import { findPlaceId, getPlaceDetails } from '@/lib/services/google-places-service';

interface HospitalDataState {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and enrich hospital data using Google Places API.
 */
export function useHospitalData(): HospitalDataState {
  const [state, setState] = useState<HospitalDataState>({
    // Initialize with base data structure but empty details initially
    hospitals: baseHospitalData.map(h => ({ id: h.id, name: h.name })), 
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component

    const fetchHospitalData = async () => {
      // Keep initial loading state until all fetches complete
      // setState(prev => ({ ...prev, loading: true, error: null })); 
      try {
        const enrichedHospitalsPromises = baseHospitalData.map(async (baseHospital) => {
          const placeId = await findPlaceId(baseHospital.queryHint);
          if (placeId) {
            const details = await getPlaceDetails(placeId);
            if (details) {
              // Merge base info (id, original name) with fetched details
              return {
                id: baseHospital.id, 
                name: baseHospital.name, 
                ...details, 
              };
            } else {
               console.warn(`Could not fetch details for ${baseHospital.name} (Place ID: ${placeId})`);
               // Return base data + placeId if details fetch failed
               return { id: baseHospital.id, name: baseHospital.name, placeId };
            }
          } else {
             console.warn(`Could not find Place ID for ${baseHospital.name} using query: ${baseHospital.queryHint}`);
             // Return only base data if Place ID not found
             return { id: baseHospital.id, name: baseHospital.name };
          }
        });

        // Wait for all promises to resolve
        const resolvedHospitals = await Promise.all(enrichedHospitalsPromises);

        if (isMounted) {
          // Filter out any potential null/undefined results if needed, though current logic returns objects
          const finalHospitals = resolvedHospitals.filter(h => h) as Hospital[];
          setState({ hospitals: finalHospitals, loading: false, error: null });
        }
      } catch (err) {
        console.error("Error fetching hospital data:", err);
        if (isMounted) {
          setState(prev => ({ ...prev, loading: false, error: 'Failed to load hospital data.' }));
        }
      }
    };

    fetchHospitalData();

    return () => {
      isMounted = false; // Cleanup function to set isMounted to false
    };
  }, []); // Fetch only once on mount

  return state;
} 