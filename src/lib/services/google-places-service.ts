/// <reference types="vite/client" />

import type { Hospital } from '@/types/hospital';

// Define structured return types
interface FindPlaceIdResult {
  data: string | null;
  error: string | null;
}
interface GetPlaceDetailsResult {
  data: Partial<Hospital> | null;
  error: string | null;
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
// Remove BASE_URL as we use relative proxy path
// const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

if (!API_KEY) {
  console.error('Missing Google Places API key. Set VITE_GOOGLE_PLACES_API_KEY in your .env file.');
}

/**
 * Finds the Place ID for a given query using Google Places Text Search API.
 * Uses the Vite proxy defined in vite.config.ts for CORS.
 */
export async function findPlaceId(query: string): Promise<FindPlaceIdResult> {
  if (!API_KEY) return { data: null, error: "Configuration error: Google API key missing." };
  // Use relative proxy path defined in vite.config.ts
  const url = `/api/google-places/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Log more details on failure
      const errorBody = await response.text();
      const errorMsg = `Google Places Text Search failed: ${response.status} ${response.statusText}`;
      console.error(errorMsg, errorBody);
      return { data: null, error: errorMsg };
    }
    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return { data: data.results[0].place_id, error: null };
    }
    // Log Google's error message if available
    const googleError = data.error_message || data.status;
    console.warn(`Google Places Text Search status not OK for query "${query}": ${data.status}`, googleError);
    return { data: null, error: `Google Places error: ${googleError}` };
  } catch (error) {
    console.error(`Error finding place ID for query "${query}":`, error);
    const errorMsg = error instanceof Error ? error.message : "An unknown error occurred finding place ID.";
    return { data: null, error: errorMsg };
  }
}

/**
 * Fetches detailed information for a place using its Place ID.
 * Uses the Vite proxy defined in vite.config.ts for CORS.
 */
export async function getPlaceDetails(placeId: string): Promise<GetPlaceDetailsResult> {
  if (!API_KEY) return { data: null, error: "Configuration error: Google API key missing." };
  const fields = 'place_id,name,geometry,formatted_address,international_phone_number,opening_hours,website';
  // Use relative proxy path defined in vite.config.ts
  const url = `/api/google-places/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
     if (!response.ok) {
       // Log more details on failure
       const errorBody = await response.text();
       const errorMsg = `Google Places Details failed: ${response.status} ${response.statusText}`;
       console.error(errorMsg, errorBody);
       return { data: null, error: errorMsg };
    }
    const data = await response.json();
    if (data.status === 'OK' && data.result) {
      const result = data.result;
      const details: Partial<Hospital> = {
        placeId: result.place_id,
        coordinates: result.geometry?.location ? [result.geometry.location.lng, result.geometry.location.lat] : undefined,
        address: result.formatted_address,
        phone: result.international_phone_number,
        openingHours: result.opening_hours ? {
          open_now: result.opening_hours.open_now,
          periods: result.opening_hours.periods,
          weekday_text: result.opening_hours.weekday_text,
        } : undefined,
        isOpen: result.opening_hours?.open_now,
        hours: result.opening_hours?.weekday_text?.[0]?.split(': ')?.[1],
        website: result.website,
      };
      return { data: details, error: null };
    }
    // Log Google's error message if available
    const googleError = data.error_message || data.status;
    console.warn(`Google Places Details status not OK for placeId "${placeId}": ${data.status}`, googleError);
    return { data: null, error: `Google Places error: ${googleError}` };
  } catch (error) {
    console.error(`Error getting place details for placeId "${placeId}":`, error);
    const errorMsg = error instanceof Error ? error.message : "An unknown error occurred getting place details.";
    return { data: null, error: errorMsg };
  }
} 