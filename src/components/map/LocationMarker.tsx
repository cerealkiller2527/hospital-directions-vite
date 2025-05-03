"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import type { Hospital } from '@/types/hospital';
import { cn } from '@/lib/utils';
import { DEFAULT_MAP_VIEW } from '@/lib/mapbox'; // Import DEFAULT_MAP_VIEW
import { icons } from '@/lib/icons'; // Import centralized map
import { Hospital as HospitalIcon, Info } from 'lucide-react'; // Keep fallback import, add Info icon
import { calculateBearing } from '@/lib/utils';
import { toast } from 'sonner'; // Import toast

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
    flyTo,
    activeTab // Get activeTab from context
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
    if (!map || !currentElement || !hospital) return;

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation(); 
      setAnimatingMarkerId(null);

      const isCurrentlySelected = selectedLocation?.id === hospital.id;
      const isPopupCurrentlyOpen = popupLocation?.id === hospital.id;
  
      if (activeTab === 'directions') {
          // --- Directions Tab Logic ---
          if (isCurrentlySelected) {
              // Clicked the marker that is *already* the selected destination
              if (isPopupCurrentlyOpen) {
                  setPopupLocation(null); // Close the popup
              } else {
                  setPopupLocation(hospital); // Open the popup
              }
              // No toast, no setSelectedLocation call needed
          } else {
              // Clicked a *different* marker while directions are active
              setSelectedLocation(hospital); // Switch the destination
              setPopupLocation(null);      // Ensure any other popup is closed
              // Show toast only when switching
              toast.info(`Calculating directions to ${hospital.name}`, {
                 icon: <Info className="h-4 w-4" />,
              });
              // No flyTo needed, RouteLayerManager handles bounds
          }
      } else {
          // --- List Tab Logic ---
          setSelectedLocation(hospital); // Always select the clicked marker in list view
  
          if (isPopupCurrentlyOpen) {
               // Clicked the marker whose popup is already open
               setPopupLocation(null); // Close the popup
          } else {
               // Clicked a marker whose popup is closed (or a different marker)
               setPopupLocation(hospital); // Open the popup for the clicked marker
               // Fly to the marker only when opening its popup
               let flyToOptions: CustomFlyToOptions = {
                  pitch: 70, 
                  speed: 1.8,
                  bearing: map?.getBearing() ?? 0, 
                  zoom: DEFAULT_MAP_VIEW.maxZoom // Use maxZoom for marker clicks in list view
                };
               // ... (rest of flyTo calculation logic) ...
               if (hospital.id === 1) {
                  flyToOptions = {
                    ...flyToOptions,
                    zoom: 19.56, 
                    pitch: 71.00,
                    bearing: 16.00,
                  };
                  flyTo([-71.167169, 42.323224], flyToOptions.zoom, flyToOptions, hospital.id);
                } else { 
                  let calculatedBearing = flyToOptions.bearing;
                  if (userLocation && hospital.coordinates) {
                    try {
                      calculatedBearing = calculateBearing(userLocation, hospital.coordinates as [number, number]);
                    } catch (error) {
                      console.error("Error calculating bearing:", error);
                    }
                  }
                  flyToOptions.bearing = calculatedBearing;
                  flyTo(hospital.coordinates as [number, number], flyToOptions.zoom, flyToOptions, hospital.id); 
                }
          }
      }
    };

    currentElement.addEventListener('click', handleClick);

    // Cleanup function
    return () => {
      currentElement.removeEventListener('click', handleClick);
    };
  // Update dependencies: Added selectedLocation?.id
  }, [map, hospital.id, hospital.coordinates, userLocation, popupLocation?.id, selectedLocation?.id, flyTo, setAnimatingMarkerId, setSelectedLocation, setPopupLocation, activeTab]);

  const isSelected = selectedLocation?.id === hospital.id;
  const shouldAnimate = animatingMarkerId === hospital.id;

  return (
    <div ref={markerElementRef} className="marker-dom-element cursor-pointer" style={{ pointerEvents: 'auto' }}>
      {/* Apply jump animation to this container when selected */}
      <div className={cn(
        'relative', 
        'transition-transform duration-150 ease-in-out',
        // ADDED: Apply jump animation when selected
        isSelected && 'animate-marker-jump'
      )}>
        {/* Icon Container - Apply glow class here when selected */}
        <div className={cn(
          `relative h-8 w-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-background transition-all`,
          // Use primary blue background and white icon color
          isSelected 
            ? 'bg-primary text-primary-foreground ring-primary ring-offset-primary/30'
            : 'bg-primary text-primary-foreground ring-primary ring-offset-primary/30',
          // Apply glow animation class when selected
          isSelected && 'marker-icon-container-glow'
        )}>
          {/* Render the selected icon */}
          <IconComponent className="h-4 w-4" />
        </div>
        {/* Tip */}
        <div className={cn(
          `absolute -bottom-[8.5px] left-1/2 -translate-x-1/2 w-0 h-0`,
          `border-l-[6px] border-l-transparent`,
          `border-t-[9px]`,
          `border-r-[6px] border-r-transparent`,
          `transition-colors z-10`,
          isSelected ? 'border-t-primary' : 'border-t-primary'
        )}></div>
      </div>
    </div>
  );
} 