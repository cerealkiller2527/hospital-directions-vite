"use client"

import { Plus, Minus, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMap } from "@/contexts/MapContext";
import { DEFAULT_MAP_VIEW } from "@/lib/mapbox";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

export function MapControls() {
  const { 
    zoomIn, 
    zoomOut, 
    isMinZoom, 
    isMaxZoom, 
    flyTo,
    userLocation 
  } = useMap();
  const { getCurrentPosition, loading: geoLoading } = useGeolocation();

  const handleMyLocationClick = () => {
    if (userLocation) {
      flyTo(userLocation, DEFAULT_MAP_VIEW.maxZoom - 2, { pitch: 60, speed: 1.5 });
    } else {
      getCurrentPosition();
    }
  };

  return (
    <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-md shadow-md bg-white border-gray-200 hover:bg-gray-50 text-primary"
        aria-label="Go to my location"
        onClick={handleMyLocationClick}
        disabled={geoLoading}
      >
        <Navigation className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-md shadow-md bg-white border-gray-200 hover:bg-gray-50 text-primary"
        aria-label="Zoom in"
        onClick={zoomIn}
        disabled={isMaxZoom}
      >
        <Plus className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-md shadow-md bg-white border-gray-200 hover:bg-gray-50 text-primary"
        aria-label="Zoom out"
        onClick={zoomOut}
        disabled={isMinZoom}
      >
        <Minus className="h-5 w-5" />
      </Button>
    </div>
  );
} 