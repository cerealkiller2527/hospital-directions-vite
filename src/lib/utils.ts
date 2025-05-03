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
