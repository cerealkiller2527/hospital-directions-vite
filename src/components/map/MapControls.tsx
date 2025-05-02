"use client"

import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMap } from "@/contexts/MapContext";

export function MapControls() {
  const { zoomIn, zoomOut, isMinZoom, isMaxZoom } = useMap();

  return (
    <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
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