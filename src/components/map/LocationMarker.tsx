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
// Import constants
import { DEFAULT_FLY_TO_OPTIONS, HOSPITAL_CUSTOM_VIEWS } from '@/lib/constants'; 

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

    // --- Helper function for List Tab click logic ---
    const handleListTabClick = (clickedHospital: Hospital) => {
        setSelectedLocation(clickedHospital); // Always select in list view

        const isPopupCurrentlyOpen = popupLocation?.id === clickedHospital.id;
        if (isPopupCurrentlyOpen) {
            setPopupLocation(null); // Close popup if already open for this marker
        } else {
            setPopupLocation(clickedHospital); // Open popup for the clicked marker
            
            // --- Prevent flyTo if this marker is already the selected one --- 
            if (selectedLocation?.id !== clickedHospital.id) {
              // Fly to the marker only when opening its popup AND it wasn't already selected
              
              // Get custom view options or fallback to defaults
              const customView = HOSPITAL_CUSTOM_VIEWS[clickedHospital.id] || {};
              const defaultOptions = DEFAULT_FLY_TO_OPTIONS; // For easier access

              let flyToOptions: CustomFlyToOptions & { center: [number, number]; zoom: number } = {
                // Base options from defaults
                pitch: defaultOptions.pitch,
                speed: defaultOptions.speed,
                curve: defaultOptions.curve,
                bearing: map?.getBearing() ?? defaultOptions.bearing,
                zoom: defaultOptions.zoom,
                center: clickedHospital.coordinates as [number, number], // Default center to hospital coords
                
                // Override with custom view settings if they exist
                ...customView, 
              };
              
              // Use custom coordinates if provided, otherwise stick to hospital's
              if (customView.coordinates) {
                  flyToOptions.center = customView.coordinates;
              }

              // Override bearing only if not explicitly set in custom view
              if (userLocation && customView.bearing === undefined) {
                try {
                  flyToOptions.bearing = calculateBearing(userLocation, flyToOptions.center);
                } catch (error) {
                  console.error("Error calculating bearing:", error);
                }
              }
              
              // Call flyTo with the constructed options
              flyTo(flyToOptions.center, flyToOptions.zoom, flyToOptions, clickedHospital.id);

            } // --- End of flyTo condition ---
        }
    };

    // --- Helper function for Directions Tab click logic ---
    const handleDirectionsTabClick = (clickedHospital: Hospital) => {
        const isCurrentlySelected = selectedLocation?.id === clickedHospital.id;
        const isPopupCurrentlyOpen = popupLocation?.id === clickedHospital.id;

        if (isCurrentlySelected) {
            // Clicked the marker that is *already* the selected destination
            if (isPopupCurrentlyOpen) {
                setPopupLocation(null); // Close the popup
            } else {
                setPopupLocation(clickedHospital); // Open the popup
            }
        } else {
            // Clicked a *different* marker while directions are active
            setSelectedLocation(clickedHospital); // Switch the destination
            setPopupLocation(null);      // Ensure any other popup is closed
            toast.info(`Calculating directions to ${clickedHospital.name}`, {
               icon: <Info className="h-4 w-4" />,
            });
        }
    };

    // --- Main click handler --- 
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation(); 
      setAnimatingMarkerId(null); // Stop any animation on click

      if (activeTab === 'directions') {
          handleDirectionsTabClick(hospital);
      } else {
          handleListTabClick(hospital);
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
        {/* Tip - Adjust bottom offset to close the gap */}
        <div className={cn(
          `absolute -bottom-[12px] left-1/2 -translate-x-1/2 w-0 h-0`,
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