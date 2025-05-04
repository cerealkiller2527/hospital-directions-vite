"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import type { Hospital } from '@/types/hospital';
import { cn } from '@/lib/utils';
import { icons } from '@/lib/icons'; // Import centralized map
import { Hospital as HospitalIcon, Info } from 'lucide-react'; // Keep fallback import, add Info icon
import { calculateBearing } from '@/lib/utils';
import { toast } from 'sonner'; // Import toast
// Import constants
import {
  DEFAULT_FLY_TO_OPTIONS,
  HOSPITAL_SPECIFIC_VIEWS
} from '@/lib/constants'; 
// Add CameraOptions import
import type { CameraOptions } from 'mapbox-gl';

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
    userLocation, // Get userLocation from context
    flyTo,
    activeTab // Get activeTab from context
  } = useMap();
  
  // Ref for the Mapbox marker instance
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  // Ref to hold the DOM element *created programmatically*
  const markerElementRef = useRef<HTMLDivElement | null>(null);

  // Find the icon component based on name, default to HospitalIcon
  const IconComponent = useMemo(() => icons[iconName] || HospitalIcon, [iconName]);

  const isSelected = selectedLocation?.id === hospital.id;

  // --- Logic for clicking the marker element (remains largely the same) ---
  const handleListTabClick = (clickedHospital: Hospital) => {
      setSelectedLocation(clickedHospital);
      const isPopupCurrentlyOpen = popupLocation?.id === clickedHospital.id;
      if (isPopupCurrentlyOpen) {
          setPopupLocation(null);
      } else {
          setPopupLocation(clickedHospital);
          if (selectedLocation?.id !== clickedHospital.id) {
            if (clickedHospital.coordinates) {
              const specificView = HOSPITAL_SPECIFIC_VIEWS[clickedHospital.id] || {};
              const targetCenter = specificView.coordinates || clickedHospital.coordinates;
              let flyToOptions: CustomFlyToOptions & Pick<CameraOptions, 'zoom' | 'pitch' | 'bearing'> = {
                speed: DEFAULT_FLY_TO_OPTIONS.speed,
                curve: DEFAULT_FLY_TO_OPTIONS.curve,
                zoom: specificView.zoom ?? DEFAULT_FLY_TO_OPTIONS.zoom,
                pitch: specificView.pitch ?? DEFAULT_FLY_TO_OPTIONS.pitch,
                bearing: specificView.bearing ?? map?.getBearing() ?? 0,
              };
              if (specificView.bearing === undefined && userLocation) {
                try { flyToOptions.bearing = calculateBearing(userLocation, targetCenter as [number, number]); } catch (error) { console.error("Error bearing:", error); }
              }
              flyTo(targetCenter as [number, number], flyToOptions.zoom, flyToOptions, clickedHospital.id);
            }
          }
      }
  };

  const handleDirectionsTabClick = (clickedHospital: Hospital) => {
      const isCurrentlySelected = selectedLocation?.id === clickedHospital.id;
      const isPopupCurrentlyOpen = popupLocation?.id === clickedHospital.id;
      if (isCurrentlySelected) {
          if (isPopupCurrentlyOpen) { setPopupLocation(null); } else { setPopupLocation(clickedHospital); }
      } else {
          setSelectedLocation(clickedHospital);
          setPopupLocation(null);
          toast.info(`Calculating directions to ${clickedHospital.name}`, { icon: <Info className="h-4 w-4" /> });
      }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => { // Change type to React.MouseEvent
    e.stopPropagation();
    if (activeTab === 'directions') {
        handleDirectionsTabClick(hospital);
    } else {
        handleListTabClick(hospital);
    }
  };

  // Effect for creating/updating the Mapbox marker instance
  useEffect(() => {
    if (!map || !hospital.coordinates || !markerElementRef.current) return;

    // --- Create or update Mapbox Marker --- 
    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({
        element: markerElementRef.current, // Use the React-rendered element
        anchor: 'bottom',
      })
        .setLngLat(hospital.coordinates as [number, number])
        .addTo(map);
    } else {
      // Just update position if marker already exists
      markerRef.current.setLngLat(hospital.coordinates as [number, number]);
    }

    // Cleanup function to remove the Mapbox marker
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  // Dependencies: map instance and coordinates
  }, [map, hospital.coordinates]); // Keep dependencies minimal for marker management

  // Restore JSX structure
  return (
    <div 
      ref={markerElementRef} 
      className="marker-dom-element cursor-pointer" 
      style={{ pointerEvents: 'auto' }} 
      onClick={handleClick} // Use React onClick
    >
      {/* Apply jump animation to this container when selected */}
      <div className={cn(
        'relative', 
        'transition-transform duration-150 ease-in-out',
        isSelected && 'animate-marker-jump'
      )}>
        {/* Icon Container - Apply glow class here when selected */}
        <div className={cn(
          `relative h-8 w-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-background transition-all`,
          isSelected 
            ? 'bg-primary text-primary-foreground ring-primary ring-offset-primary/30'
            : 'bg-primary text-primary-foreground ring-primary ring-offset-primary/30', // Ensure non-selected state is defined
          isSelected && 'marker-icon-container-glow'
        )}>
          {/* Render the dynamic IconComponent directly */}
          <IconComponent className="h-4 w-4" />
        </div>
        {/* Tip */}
        <div className={cn(
          `tip-element absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-0 h-0`,
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