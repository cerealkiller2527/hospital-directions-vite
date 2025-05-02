"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';

export function UserLocationMarker() {
  const { map, userLocation } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null); // Ref to hold the DOM element

  useEffect(() => {
    // Create the element only once
    if (!elementRef.current) {
      elementRef.current = document.createElement('div');
      elementRef.current.className = 'h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-500/30 animate-pulse';
      elementRef.current.style.zIndex = '1'; // Ensure it's above map tiles but below hospital markers/popups
    }

    if (map && userLocation) {
      if (markerRef.current) {
        // Update existing marker position
        markerRef.current.setLngLat(userLocation);
      } else {
        // Create new marker
        if (elementRef.current) { // Ensure element exists
            markerRef.current = new mapboxgl.Marker(elementRef.current)
            .setLngLat(userLocation)
            .addTo(map);
        }
      }
    } else if (markerRef.current) {
      // If no userLocation or map, remove the marker
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Cleanup function: Remove marker when component unmounts or map/userLocation become invalid
    return () => {
      if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
      }
    };
  }, [map, userLocation]);

  // This component doesn't render anything in the React tree itself
  return null;
} 