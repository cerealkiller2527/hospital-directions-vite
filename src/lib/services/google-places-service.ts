/// <reference types="vite/client" />

import type { Hospital } from '@/types/hospital';
import { GOOGLE_PLACES_FIELDS } from '@/lib/constants'; // Import constants

// Define structured return types
interface FindPlaceIdResult {
  data: string | null;
  error: string | null;
}
interface GetPlaceDetailsResult {
  data: Partial<Hospital> | null;
  error: string | null;
}

// Use the original environment variable name
const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const BASE_URL = '/api/google-places'; // Use the proxy path

interface PlaceDetailsResult {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  coordinates?: [number, number];
  isOpen?: boolean;
  placeId?: string;
}

interface PlaceSearchResult {
  data: string | null; // Place ID
  error: string | null;
}

// New interface for Autocomplete suggestions
export interface AutocompleteSuggestion {
  description: string;
  place_id: string;
}

// New interface for Autocomplete response
interface AutocompleteResponse {
  data: AutocompleteSuggestion[] | null;
  error: string | null;
}

// New interface for Coordinates response
interface CoordinatesResponse {
  data: [number, number] | null;
  error: string | null;
}

if (!API_KEY) {
  // Update error message to reflect the correct variable name
  console.error('Missing Google Places API key. Set VITE_GOOGLE_PLACES_API_KEY in your .env file.');
}

/**
 * Finds the Place ID for a given query using Google Places Text Search API.
 * Uses the Vite proxy defined in vite.config.ts for CORS.
 */
export async function findPlaceId(query: string): Promise<PlaceSearchResult> {
  if (!API_KEY) return { data: null, error: 'Google API Key missing' };
  const url = `${BASE_URL}/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=${GOOGLE_PLACES_FIELDS.PLACE_ID}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      return { data: data.candidates[0].place_id, error: null };
    } else {
      return { data: null, error: data.error_message || `No place ID found for query: ${query}` };
    }
  } catch (error) {
    console.error('Error finding place ID:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: `Failed to fetch place ID: ${message}` };
  }
}

/**
 * Fetches detailed information for a place using its Place ID.
 * Uses the Vite proxy defined in vite.config.ts for CORS.
 */
export async function getPlaceDetails(placeId: string): Promise<{ data: PlaceDetailsResult | null; error: string | null }> {
  if (!API_KEY) return { data: null, error: 'Google API Key missing' };
  const fields = GOOGLE_PLACES_FIELDS.DETAILS;
  const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'OK') {
      const result = data.result;
      const details: PlaceDetailsResult = {
        // Fetch the name from Google, but it will be overwritten in useHospitalData
        name: result.name, 
        address: result.formatted_address,
        phone: result.international_phone_number,
        website: result.website,
        placeId: result.place_id,
        coordinates: result.geometry?.location ? [result.geometry.location.lng, result.geometry.location.lat] : undefined,
        isOpen: result.opening_hours?.open_now,
      };
      return { data: details, error: null };
    } else {
      return { data: null, error: data.error_message || `Failed to get details for Place ID: ${placeId}` };
    }
  } catch (error) {
    console.error('Error fetching place details:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: `Failed to fetch place details: ${message}` };
  }
}

/**
 * Get Place Autocomplete suggestions using Google Places Autocomplete API.
 */
export async function getPlaceAutocomplete(input: string): Promise<AutocompleteResponse> {
  if (!input) return { data: [], error: null }; // Return empty array if input is empty
  if (!API_KEY) return { data: null, error: 'Google API Key missing' };
  
  // Bias results towards the rough viewport or user location if available? (Optional)
  // Add types=address or types=geocode if you only want locations/addresses
  const url = `${BASE_URL}/autocomplete/json?input=${encodeURIComponent(input)}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'OK') {
      const suggestions: AutocompleteSuggestion[] = data.predictions.map((p: any) => ({
        description: p.description,
        place_id: p.place_id,
      }));
      return { data: suggestions, error: null };
    } else if (data.status === 'ZERO_RESULTS') {
      return { data: [], error: null }; // No results is not an error
    } else {
      return { data: null, error: data.error_message || 'Failed to get autocomplete suggestions' };
    }
  } catch (error) {
    console.error('Error fetching autocomplete:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: `Failed to fetch autocomplete: ${message}` };
  }
}

/**
 * Get Coordinates from Place ID using Google Places Details API.
 */
export async function getCoordsFromPlaceId(placeId: string): Promise<CoordinatesResponse> {
  if (!API_KEY) return { data: null, error: 'Google API Key missing' };
  const fields = GOOGLE_PLACES_FIELDS.GEOMETRY; // Only fetch geometry
  const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'OK' && data.result?.geometry?.location) {
      const coords: [number, number] = [data.result.geometry.location.lng, data.result.geometry.location.lat];
      return { data: coords, error: null };
    } else {
      return { data: null, error: data.error_message || `Failed to get coordinates for Place ID: ${placeId}` };
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: `Failed to fetch coordinates: ${message}` };
  }
} 