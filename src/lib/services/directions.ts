import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';
import type { Directions, TransportMode, DirectionStep } from '@/types/hospital';
import type { Feature, LineString } from 'geojson';

// Map local transport modes to Mapbox Directions API profiles
const transportModeToProfile: Record<TransportMode, string> = {
  drive: 'driving-traffic', // Use driving-traffic for realistic ETAs
  walk: 'walking',
  transit: 'driving', // Fallback - Mapbox Directions API doesn't directly support public transit routing
};

// Define a type for the enriched route data we want to return
export interface EnrichedRoute {
  id: string; // Add an ID for React keys, can use index or route ID from API if available
  directions: Directions;
  geometry: LineString;
  congestion?: string[]; // Array of congestion levels per segment
  duration_typical?: number; // Duration based on typical traffic (seconds)
  isActive?: boolean; // Flag to indicate if this is the currently displayed route
}

export async function getDirections(
  origin: [number, number], // [lng, lat]
  destination: [number, number], // [lng, lat]
  mode: TransportMode
): Promise<EnrichedRoute[] | null> { // Return array of enriched routes or null
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error("Mapbox Access Token is missing.");
    return null;
  }
  const profile = transportModeToProfile[mode];
  const coordinates = `${origin.join(',')};${destination.join(',')}`;
  // Add alternatives=true and annotations
  const annotations = 'duration,distance,congestion';
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?steps=true&geometries=geojson&overview=full&alternatives=true&annotations=${annotations}&access_token=${MAPBOX_ACCESS_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Mapbox Directions API error: ${response.status} ${response.statusText}`, errorBody);
      return null;
    }
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn("Mapbox Directions API: No routes found.");
      return null;
    }

    // Map over all routes
    const enrichedRoutes: EnrichedRoute[] = data.routes.map((route: any, index: number): EnrichedRoute => {
      const leg = route.legs[0];
      const congestion = leg.annotation?.congestion;
      
      const steps: DirectionStep[] = leg.steps.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: `${(step.distance * 0.000621371).toFixed(1)} mi`,
        duration: `${Math.round(step.duration / 60)} min`,
      }));

      const directions: Directions = {
        steps: steps,
        distance: `${(route.distance * 0.000621371).toFixed(1)} mi`,
        duration: `${Math.round((route.duration_typical ?? route.duration) / 60)} min`,
      };

      const geometry = route.geometry as LineString;

      return {
        id: `route-${index}`, // Simple ID based on index
        directions,
        geometry,
        congestion,
        duration_typical: route.duration_typical,
        isActive: index === 0 // Mark the first route as active initially
      };
    });

    return enrichedRoutes;

  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
} 