"use client"

import { Plus, Minus, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMap } from "@/contexts/MapContext";
import { DEFAULT_MAP_VIEW } from "@/lib/mapbox";
import { DEFAULT_FLY_TO_OPTIONS } from "@/lib/constants";

interface MapControlsProps {
  userLocation: [number, number] | null;
  getCurrentPosition: () => void;
  geoLoading: boolean;
}

export function MapControls({ 
  userLocation, 
  getCurrentPosition, 
  geoLoading 
}: MapControlsProps) {
  const { 
    zoomIn, 
    zoomOut, 
    isMinZoom, 
    isMaxZoom, 
    flyTo,
  } = useMap();

  const handleMyLocationClick = () => {
    if (userLocation) {
      flyTo(userLocation, DEFAULT_FLY_TO_OPTIONS.zoom, { 
        pitch: DEFAULT_FLY_TO_OPTIONS.pitch, 
        speed: DEFAULT_FLY_TO_OPTIONS.speed 
      });
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
        aria-label={userLocation ? "Go to my location" : "Find my location"}
        onClick={handleMyLocationClick}
        disabled={geoLoading}
      >
        {geoLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
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