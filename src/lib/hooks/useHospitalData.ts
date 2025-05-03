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
    let isMounted = true;
    const fetchHospitalData = async () => {
      let overallError: string | null = null; // Track if any fetch fails

      try {
        const enrichedHospitalsPromises = baseHospitalData.map(async (baseHospital) => {
          const placeIdResult = await findPlaceId(baseHospital.queryHint);
          
          if (placeIdResult.error) {
            console.warn(`Failed to find Place ID for ${baseHospital.name}: ${placeIdResult.error}`);
            overallError = overallError || "Partial data load: Could not find location ID for some hospitals.";
            return { id: baseHospital.id, name: baseHospital.name }; // Return base data on ID error
          }

          if (placeIdResult.data) {
            const detailsResult = await getPlaceDetails(placeIdResult.data);
            if (detailsResult.error) {
              console.warn(`Failed to fetch details for ${baseHospital.name} (Place ID: ${placeIdResult.data}): ${detailsResult.error}`);
              overallError = overallError || "Partial data load: Could not fetch details for some hospitals.";
              return { id: baseHospital.id, name: baseHospital.name, placeId: placeIdResult.data }; // Return base + placeId
            }
            if (detailsResult.data) {
              return {
                id: baseHospital.id, 
                name: baseHospital.name, 
                ...detailsResult.data, 
              }; // Success: Merge base + details
            }
          }
          // Fallback if placeIdResult.data was null (shouldn't happen if error check passes, but belts and suspenders)
          return { id: baseHospital.id, name: baseHospital.name };
        });

        const resolvedHospitals = await Promise.all(enrichedHospitalsPromises);

        if (isMounted) {
          const finalHospitals = resolvedHospitals.filter(h => h) as Hospital[];
          // Set the overall error if one occurred, otherwise null
          setState({ hospitals: finalHospitals, loading: false, error: overallError }); 
        }
      } catch (err) {
        // Catch unexpected errors during the Promise.all or mapping setup
        console.error("Unexpected error fetching hospital data:", err);
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load hospital data.';
          setState(prev => ({ ...prev, loading: false, error: errorMsg }));
        }
      }
    };
    fetchHospitalData();
    return () => { isMounted = false; };
  }, []);

  return state;
} 