"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import type { Hospital } from '@/types/hospital';
import { cn } from '@/lib/utils';
import { DEFAULT_MAP_VIEW } from '@/lib/mapbox'; // Import DEFAULT_MAP_VIEW
import * as turf from '@turf/turf'; // Import turf
import { icons } from '@/lib/icons'; // Import centralized map
import { Hospital as HospitalIcon } from 'lucide-react'; // Keep fallback import

// Define the combined type for flyTo options
type CustomFlyToOptions = Omit<mapboxgl.CameraOptions & mapboxgl.AnimationOptions, 'center'>;

interface LocationMarkerProps {
  hospital: Hospital;
  iconName: string; // Use iconName instead of index
}

export function LocationMarker({ hospital, iconName }: LocationMarkerProps) {
  const { 
    map, 
    selectedLocation, setSelectedLocation, 
    popupLocation, setPopupLocation, 
    animatingMarkerId, setAnimatingMarkerId, // Re-add animation state/setter
    userLocation, // Get userLocation from context
    flyTo 
  } = useMap();
  const markerElementRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Find the icon component based on name, default to HospitalIcon
  const IconComponent = icons[iconName] || HospitalIcon;

  // Effect for marker creation and position updates
  useEffect(() => {
    if (!map || !markerElementRef.current || !hospital.coordinates) {
      // If map/element/coords aren't ready, or if marker exists, remove it
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return; // Exit early
    }

    // If marker doesn't exist, create it
    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({
        element: markerElementRef.current,
        anchor: 'bottom',
        offset: [0, 0]
      })
        .setLngLat(hospital.coordinates as [number, number])
        .addTo(map);
    } else {
      // If marker exists, just update its position
      markerRef.current.setLngLat(hospital.coordinates as [number, number]);
    }

    // Cleanup function to remove marker when dependencies change or component unmounts
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, hospital.coordinates]); // Depend only on map instance and coordinates for position

  // Effect for adding/removing the click listener
  useEffect(() => {
    const currentElement = markerElementRef.current;
    if (!map || !currentElement || !hospital) return; // Ensure map, element, and hospital are available

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation(); 
      setAnimatingMarkerId(null);
      setSelectedLocation(hospital);

      if (popupLocation?.id === hospital.id) {
        setPopupLocation(null);
      } else {
        setPopupLocation(hospital);
        
        let flyToOptions: CustomFlyToOptions = {
          pitch: 70, 
          speed: 1.8,
          bearing: map?.getBearing() ?? 0, 
          zoom: DEFAULT_MAP_VIEW.maxZoom 
        };

        if (hospital.id === 1) {
          flyToOptions = {
            ...flyToOptions,
            // No center here, flyTo takes center as first arg
            zoom: 19.56, 
            pitch: 71.00,
            bearing: 16.00,
          };
          // Pass hospital ID
          flyTo([-71.167169, 42.323224], flyToOptions.zoom, flyToOptions, hospital.id);
        } else { 
          let calculatedBearing = flyToOptions.bearing; // Start with default/current
          if (userLocation && hospital.coordinates) {
            try {
              const startPoint = turf.point(userLocation);
              const endPoint = turf.point(hospital.coordinates as [number, number]);
              calculatedBearing = turf.bearing(startPoint, endPoint);
            } catch (error) {
              console.error("Error calculating bearing:", error);
            }
          }
          flyToOptions.bearing = calculatedBearing; // Update bearing
          // Pass hospital ID
          flyTo(hospital.coordinates as [number, number], flyToOptions.zoom, flyToOptions, hospital.id); 
        }
      }
    };

    currentElement.addEventListener('click', handleClick);

    // Cleanup function for the listener
    return () => {
      currentElement.removeEventListener('click', handleClick);
    };
  // Refine dependencies for the click handler logic
  }, [map, hospital.id, hospital.coordinates, userLocation, popupLocation?.id, flyTo, setAnimatingMarkerId, setSelectedLocation, setPopupLocation]); // Use specific/stable values

  const isSelected = selectedLocation?.id === hospital.id;
  const shouldAnimate = animatingMarkerId === hospital.id;

  return (
    <div ref={markerElementRef} className="marker-dom-element cursor-pointer" style={{ pointerEvents: 'auto' }}>
      <div className={cn(
        'relative', 
        'transition-transform duration-150 ease-in-out',
        isSelected && 'scale-110', // Scale effect on selection
        shouldAnimate && 'animate-marker-select' // Pulse animation
      )}>
        {/* Icon Container */}
        <div className={cn(
          `h-8 w-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-background transition-all`,
          // Use primary blue background and white icon color
          isSelected 
            ? 'bg-primary text-primary-foreground ring-primary ring-offset-primary/30' // Selected state uses primary bg
            : 'bg-primary text-primary-foreground ring-primary ring-offset-primary/30' // Default state also uses primary bg
        )}>
          {/* Render the selected icon */}
          <IconComponent className="h-4 w-4" />
        </div>
        {/* Tip */}
        <div className={cn(
          `absolute -bottom-[8.5px] left-1/2 -translate-x-1/2 w-0 h-0`, // Moved tip up slightly
          `border-l-[6px] border-l-transparent`,
          `border-t-[9px]`, // Adjusted height slightly
          `border-r-[6px] border-r-transparent`,
          `transition-colors z-10`,
          // Tip color matches ring color (primary)
          isSelected ? 'border-t-primary' : 'border-t-primary'
        )}></div>
      </div>
    </div>
  );
} 