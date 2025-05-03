import React from 'react';
import { Car, Train, FootprintsIcon as Walking } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMap } from "@/contexts/MapContext";

// Transport Mode Selector Component
export function TransportModeSelector({ className }: { className?: string }) {
  const { transportMode, setTransportMode } = useMap();

  return (
    <div className={cn("flex rounded-md border overflow-hidden shadow-sm", className)}>
      <button
        className={cn(
          "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs transition-colors",
          transportMode === "drive" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10",
        )}
        onClick={() => setTransportMode("drive")}
        aria-pressed={transportMode === "drive"}
      >
        <Car className="h-3 w-3" />
        <span>Drive</span>
      </button>
      <button
        className={cn(
          "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs transition-colors border-l border-r",
          transportMode === "walk" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10",
        )}
        onClick={() => setTransportMode("walk")}
        aria-pressed={transportMode === "walk"}
      >
        <Walking className="h-3 w-3" />
        <span>Walk</span>
      </button>
      <button
        className={cn(
          "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs transition-colors",
          transportMode === "transit" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10",
        )}
        onClick={() => setTransportMode("transit")}
        aria-pressed={transportMode === "transit"}
      >
        <Train className="h-3 w-3" />
        <span>Transit</span>
      </button>
    </div>
  );
} 