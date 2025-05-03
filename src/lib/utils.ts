import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Calculate the bearing between two points in degrees
 * @param start [longitude, latitude] of start point
 * @param end [longitude, latitude] of end point
 * @returns Bearing in degrees from start to end
 */
export function calculateBearing(start: [number, number], end: [number, number]): number {
  const [startLng, startLat] = start;
  const [endLng, endLat] = end;
  
  const startLatRad = startLat * Math.PI / 180;
  const endLatRad = endLat * Math.PI / 180;
  const deltaLng = (endLng - startLng) * Math.PI / 180;

  const y = Math.sin(deltaLng) * Math.cos(endLatRad);
  const x = Math.cos(startLatRad) * Math.sin(endLatRad) -
    Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(deltaLng);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

/**
 * Calculate the great-circle distance between two points (lat/lon) in miles.
 * Uses the Haversine formula.
 * @param point1 [longitude, latitude] of the first point
 * @param point2 [longitude, latitude] of the second point
 * @returns Distance in miles, or null if input is invalid.
 */
export function calculateDistance(point1: [number, number] | null | undefined, point2: [number, number] | null | undefined): number | null {
  if (!point1 || !point2) {
    return null; // Cannot calculate distance if either point is missing
  }

  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Formats a duration in seconds into a string like "X min" or "<1 min".
 * @param seconds The duration in seconds.
 * @returns Formatted string duration.
 */
export function formatDurationFromSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) {
    return "-- min";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) {
    return "<1 min";
  }
  return `${minutes} min`;
}
