"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import type { Hospital } from '@/types/hospital';
import { cn } from '@/lib/utils';
import { icons } from '@/lib/icons';
import { Hospital as HospitalIcon, Info } from 'lucide-react';
import { calculateBearing } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DEFAULT_FLY_TO_OPTIONS,
  HOSPITAL_SPECIFIC_VIEWS
} from '@/lib/constants';
import type { CameraOptions } from 'mapbox-gl';
import { createRoot } from 'react-dom/client';

type CustomFlyToOptions = Omit<mapboxgl.CameraOptions & mapboxgl.AnimationOptions, 'center'>;

interface LocationMarkerProps {
  hospital: Hospital;
  iconName: string;
}

export function LocationMarker({ hospital, iconName }: LocationMarkerProps) {
  const { 
    map, 
    selectedLocation, setSelectedLocation, 
    popupLocation, setPopupLocation, 
    setAnimatingMarkerId,
    userLocation, 
    flyTo,
    activeTab
  } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const reactRootRef = useRef<any>(null);

  const IconComponent = icons[iconName] || HospitalIcon;

  useEffect(() => {
    if (!map || !hospital.coordinates) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (reactRootRef.current) {
          reactRootRef.current.unmount();
          reactRootRef.current = null;
      }
      elementRef.current = null;
      return; 
    }

    if (!elementRef.current) {
      elementRef.current = document.createElement('div');
      elementRef.current.className = 'marker-dom-element cursor-pointer';
      
      const container = document.createElement('div');
      container.className = cn(
        'relative', 
        'transition-transform duration-150 ease-in-out',
      );
      
      const iconContainer = document.createElement('div');
      iconContainer.className = cn(
        `relative h-8 w-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-background transition-all`,
        'bg-primary text-primary-foreground ring-primary ring-offset-primary/30'
      );

      reactRootRef.current = createRoot(iconContainer);
      reactRootRef.current.render(React.createElement(IconComponent, { className: "h-4 w-4" }));
      
      const tip = document.createElement('div');
      tip.className = cn(
        `absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-0 h-0`,
        `border-l-[6px] border-l-transparent`,
        `border-t-[9px]`,
        `border-r-[6px] border-r-transparent`,
        `transition-colors z-10`,
        'border-t-primary'
      );

      container.appendChild(iconContainer);
      container.appendChild(tip);
      elementRef.current.appendChild(container);
    }

    if (!markerRef.current && elementRef.current) {
      markerRef.current = new mapboxgl.Marker({
        element: elementRef.current,
        anchor: 'bottom',
        offset: [0, 0]
      })
        .setLngLat(hospital.coordinates as [number, number])
        .addTo(map);
    } else if (markerRef.current) {
      markerRef.current.setLngLat(hospital.coordinates as [number, number]);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (reactRootRef.current) {
          reactRootRef.current.unmount();
          reactRootRef.current = null;
      }
       elementRef.current = null;
    };
  }, [map, hospital.coordinates, hospital.id, IconComponent]); 

  useEffect(() => {
    const isSelected = selectedLocation?.id === hospital.id;
    const currentElement = elementRef.current;
    if (currentElement) {
        const container = currentElement.firstChild as HTMLElement;
        const iconContainer = container?.firstChild as HTMLElement;
        const tip = container?.lastChild as HTMLElement;

        if (container) {
            container.classList.toggle('animate-marker-jump', isSelected);
        }
        if (iconContainer) {
            iconContainer.classList.toggle('marker-icon-container-glow', isSelected);
        }
         if (tip) {
             tip.classList.toggle('border-t-primary', true);
         }
    }
  }, [selectedLocation, hospital.id]);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (!map || !currentElement || !hospital) return;

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
                  try {
                    flyToOptions.bearing = calculateBearing(userLocation, targetCenter as [number, number]);
                  } catch (error) {
                    console.error("Error calculating bearing:", error);
                  }
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
            if (isPopupCurrentlyOpen) {
                setPopupLocation(null);
            } else {
                setPopupLocation(clickedHospital);
            }
        } else {
            setSelectedLocation(clickedHospital);
            setPopupLocation(null);
            toast.info(`Calculating directions to ${clickedHospital.name}`, {
               icon: <Info className="h-4 w-4" />,
            });
        }
    };

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation(); 
      setAnimatingMarkerId(null);

      if (activeTab === 'directions') {
          handleDirectionsTabClick(hospital);
      } else {
          handleListTabClick(hospital);
      }
    };

    currentElement.addEventListener('click', handleClick);

    return () => {
      if (elementRef.current) { 
        elementRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [map, hospital, userLocation, popupLocation?.id, selectedLocation?.id, flyTo, setAnimatingMarkerId, setSelectedLocation, setPopupLocation, activeTab]); 

  return null; 
}