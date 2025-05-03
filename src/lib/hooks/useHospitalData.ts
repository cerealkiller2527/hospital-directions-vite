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
    // Initialize with base data structure including original names
    hospitals: baseHospitalData.map(h => ({ id: h.id, name: h.name })), 
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHospitalData = async () => {
      let overallError: string | null = null;

      try {
        const enrichedHospitalsPromises = baseHospitalData.map(async (baseHospital) => {
          const placeIdResult = await findPlaceId(baseHospital.queryHint);
          
          if (placeIdResult.error) {
            console.warn(`Failed to find Place ID for ${baseHospital.name}: ${placeIdResult.error}`);
            overallError = overallError || "Partial data load: Could not find location ID for some hospitals.";
            // Return base data (id, name) on Place ID error
            return { id: baseHospital.id, name: baseHospital.name }; 
          }

          if (placeIdResult.data) {
            const detailsResult = await getPlaceDetails(placeIdResult.data);
            if (detailsResult.error) {
              console.warn(`Failed to fetch details for ${baseHospital.name} (Place ID: ${placeIdResult.data}): ${detailsResult.error}`);
              overallError = overallError || "Partial data load: Could not fetch details for some hospitals.";
              // Return base data (id, name) + placeId on details error
              return { id: baseHospital.id, name: baseHospital.name, placeId: placeIdResult.data }; 
            }
            if (detailsResult.data) {
              // Success: Merge base (id, name) + fetched details
              // Ensure the original baseHospital.name takes precedence
              return {
                ...detailsResult.data, // Spread fetched details first
                id: baseHospital.id,   // Overwrite with original ID
                name: baseHospital.name, // Overwrite with original Name
              }; 
            }
          }
          // Fallback if placeIdResult.data was null or detailsResult.data was null
          return { id: baseHospital.id, name: baseHospital.name };
        });

        const resolvedHospitals = await Promise.all(enrichedHospitalsPromises);

        if (isMounted) {
          const finalHospitals = resolvedHospitals.filter(h => h) as Hospital[];
          setState({ hospitals: finalHospitals, loading: false, error: overallError }); 
        }
      } catch (err) {
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