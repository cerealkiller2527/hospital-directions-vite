"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import type { Hospital } from '@/types/hospital';
import { MapPin, Phone, Globe, Clock, Navigation } from "lucide-react";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { icons } from '@/lib/icons';
import { Hospital as HospitalIcon } from 'lucide-react';

interface LocationPopupProps {
  location: Hospital;
  onViewDirections: (hospital: Hospital) => void;
  iconName: string;
}

export function LocationPopup({ location, onViewDirections, iconName }: LocationPopupProps) {
  const { map, setSelectedLocation } = useMap();
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Get the IconComponent based on the prop
  const IconComponent = icons[iconName] || HospitalIcon;

  // Memoize the container div for the portal
  const container = useMemo(() => {
    const div = document.createElement("div");
    div.className = "hospital-popup-container";
    return div;
  }, []);

  // Effect to manage the Mapbox Popup lifecycle
  useEffect(() => {
    if (!map || !location || !location.coordinates) return;

    const handleClose = () => {
      setSelectedLocation(null);
    };

    // Create or update popup
    if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({ 
            closeButton: false,
            closeOnClick: false,
            offset: 25,
            maxWidth: '280px'
        })
        .setLngLat(location.coordinates as [number, number])
        .setDOMContent(container)
        .addTo(map);
        
        // Note: The 'close' event might not fire if closeButton is false.
        // We rely on clicking the map background (handled in LocationMarker) 
        // or potentially clicking outside the popup to close it.
        // popupRef.current.on('close', handleClose); // Might remove this if close button is gone
    } else {
        // If popup exists, just update its position
        popupRef.current.setLngLat(location.coordinates as [number, number]);
    }

    // Cleanup function still needed to remove the popup if location changes/unmounts
    return () => {
      // popupRef.current?.off('close', handleClose); // Remove listener if removed above
      popupRef.current?.remove();
      popupRef.current = null;
    };
  // Ensure location change triggers repositioning/recreation if needed
  }, [map, location, container, setSelectedLocation]);

  // Adjusted status styles for bg-accent background
  const getStatusStyle = () => {
    if (location.isOpen === true) {
      // Use a subtle success color that works on accent bg
      return "bg-green-500/20 text-green-800";
    } else if (location.isOpen === false) {
      // Use a subtle destructive color
      return "bg-red-500/20 text-red-800";
    }
    // Neutral/muted color
    return "bg-slate-500/20 text-slate-800";
  };

  // Render the content into the container div using createPortal
  return createPortal(
    // Use accent background and foreground
    <div className="bg-accent text-accent-foreground rounded-md shadow-md font-sans">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <IconComponent className="h-3.5 w-3.5 text-accent-foreground flex-shrink-0" />
            <h4 className="font-semibold text-sm leading-tight">{location.name}</h4>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3 w-3 text-accent-foreground/80 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-accent-foreground/80 break-words leading-tight">
              {location.address || 'Address not available'}
            </p>
          </div>
        </div>
        
        {/* Details */}
        <div className="grid gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-accent-foreground/80 flex-shrink-0" />
            <span className="truncate text-accent-foreground/80">{location.phone || 'Phone not available'}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-accent-foreground/80 flex-shrink-0" />
            <div className={cn("flex items-center justify-center px-1.5 py-0.5 rounded-full text-center text-xs font-medium", getStatusStyle())}>
              <span>{location.isOpen === true ? 'Open Now' : location.isOpen === false ? 'Closed' : 'Hours vary'}</span>
            </div>
          </div>
          
          {location.website && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="h-3 w-3 text-accent-foreground/80 flex-shrink-0" />
              <a 
                href={location.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-accent-foreground/90 hover:text-accent-foreground underline underline-offset-2 truncate"
                title={location.website}
              >
                {location.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
        
        {/* Action Button - Use default (primary) variant */}
        <div className="pt-0.5">
          <Button 
            variant="default"
            size="sm" 
            className="w-full gap-1 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              // Call the passed handler when button is clicked
              onViewDirections(location); 
            }}
            // Disable if no coordinates
            disabled={!location.coordinates} 
          >
            <Navigation className="h-3 w-3" />
            <span>Get Directions</span>
          </Button>
        </div>
      </div>
    </div>,
    container
  );
}