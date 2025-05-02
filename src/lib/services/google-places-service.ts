/// <reference types="vite/client" />

import type { Hospital } from '@/types/hospital';

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
export async function findPlaceId(query: string): Promise<string | null> {
  if (!API_KEY) return null;
  // Use relative proxy path defined in vite.config.ts
  const url = `/api/google-places/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Log more details on failure
      const errorBody = await response.text();
      console.error(`Google Places Text Search failed: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Google Places Text Search failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].place_id;
    }
    // Log Google's error message if available
    console.warn(`Google Places Text Search status not OK for query "${query}": ${data.status}`, data.error_message || data.status);
    return null;
  } catch (error) {
    console.error(`Error finding place ID for query "${query}":`, error);
    return null;
  }
}

/**
 * Fetches detailed information for a place using its Place ID.
 * Uses the Vite proxy defined in vite.config.ts for CORS.
 */
export async function getPlaceDetails(placeId: string): Promise<Partial<Hospital> | null> {
  if (!API_KEY) return null;
  const fields = 'place_id,name,geometry,formatted_address,international_phone_number,opening_hours,website';
  // Use relative proxy path defined in vite.config.ts
  const url = `/api/google-places/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
     if (!response.ok) {
       // Log more details on failure
       const errorBody = await response.text();
       console.error(`Google Places Details failed: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Google Places Details failed with status ${response.status}`);
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
      return details;
    }
    // Log Google's error message if available
    console.warn(`Google Places Details status not OK for placeId "${placeId}": ${data.status}`, data.error_message || data.status);
    return null;
  } catch (error) {
    console.error(`Error getting place details for placeId "${placeId}":`, error);
    return null;
  }
} 