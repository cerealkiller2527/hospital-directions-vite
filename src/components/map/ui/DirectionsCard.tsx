import React, { useState, useMemo } from 'react';
import { Clock, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";
import type { Hospital, Directions, TransportMode } from "@/types/hospital";
import type { EnrichedRoute } from "@/lib/services/directions";
import { useMap } from "@/contexts/MapContext";
import { TransportModeSelector } from './TransportModeSelector'; // Assuming it's here
import { DirectionsPanel } from './DirectionsPanel'; // Assuming it's here

interface DirectionsCardProps {
  hospital: Hospital | null;
  isLoading: boolean;
  error: string | null;
  allRoutes: EnrichedRoute[] | null; // All available routes
  onSelectRoute?: (route: EnrichedRoute) => void;
  className?: string;
}

// Map internal modes to Google Maps travel modes
const googleMapsTravelModes: Record<TransportMode, string> = {
  drive: 'driving',
  walk: 'walking',
  transit: 'transit',
};

// Main Directions Card Component
export function DirectionsCard({
  hospital,
  isLoading,
  error,
  allRoutes,
  onSelectRoute,
  className,
}: DirectionsCardProps) {
  const { transportMode } = useMap();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // State for dialog

  // Derive currentRoute and its directions from allRoutes
  const currentRoute = useMemo(() => allRoutes?.find(r => r.isActive), [allRoutes]);
  const currentDirections = currentRoute?.directions ?? null;

  const estimatedTime = currentDirections?.duration ?? "-";
  const distance = currentDirections?.distance ?? "-";
  const hospitalName = hospital?.name ?? "Selected Hospital";

  const handleNavigationConfirm = () => {
    if (!hospital?.coordinates) return; 

    const [lng, lat] = hospital.coordinates;
    const travelMode = googleMapsTravelModes[transportMode];
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${travelMode}`;
    
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    setIsConfirmOpen(false); // Close dialog after opening link
  };

  return (
    <>
      <Card className={cn("bg-white border border-gray-100 shadow-sm w-full h-full flex flex-col", className)}>
        <CardHeader className="pb-2 pt-3 px-3 flex-shrink-0">
          <CardTitle className="text-sm truncate">Directions to {hospitalName}</CardTitle>
          <CardDescription>
            <span className="flex items-center text-xs">
              <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
              <span>
                {isLoading ? "Calculating..." : 
                 currentDirections ? `${estimatedTime} ${transportMode} • ${distance}` : 
                 '-'
                }
              </span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 px-3 flex-1 overflow-hidden flex flex-col h-0 min-h-0">
          <TransportModeSelector className="mb-2 flex-shrink-0" />

          {!isLoading && !error && allRoutes && allRoutes.length > 1 && (
            <div className="mb-2 flex-shrink-0">
              <Separator className="my-1" />
              <p className="text-xs font-medium text-muted-foreground mb-1">Routes:</p>
              <div className="flex flex-col gap-1">
                {allRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => onSelectRoute && onSelectRoute(route)}
                    className={cn(
                      "w-full text-left p-1.5 rounded-md text-xs transition-colors",
                      "flex justify-between items-center",
                      route.isActive
                        ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                        : "hover:bg-secondary/50 text-muted-foreground"
                    )}
                    disabled={!onSelectRoute}
                  >
                    <span>
                      {transportMode === 'drive' && route.duration_typical 
                        ? `Typically ${Math.round(route.duration_typical / 60)} min` 
                        : `${route.directions.duration}`
                      }
                    </span>
                    <span className="font-normal">{route.directions.distance}</span>
                  </button>
                ))}
              </div>
              <Separator className="mt-1 mb-0"/>
            </div>
          )}

          <div className="flex-1 h-0 min-h-0 overflow-y-auto pr-2 lowprofile-scrollbar"> 
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {error && (
               <Alert variant="destructive" className="mt-2">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {/* Use derived currentDirections here */}
            {!isLoading && !error && currentDirections && (
              <DirectionsPanel directions={currentDirections} />
            )}
            {/* Update logic for showing placeholders based on derived state */}
            {!isLoading && !error && !currentDirections && !hospital && (
              <div className="text-center py-8 text-sm text-muted-foreground flex items-center justify-center flex-1 h-full">
                Select a hospital to view directions.
              </div>
            )}
            {!isLoading && !error && !currentDirections && hospital && (
              <div className="text-center py-8 text-sm text-muted-foreground flex items-center justify-center flex-1 h-full">
                Select a starting point (e.g., My Location) to calculate directions.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2 px-3 flex-shrink-0">
          <Button variant="outline" size="sm" className="flex items-center gap-1 border-primary border-2 h-7 text-xs">
            <Volume2 className="h-3 w-3" />
            Audio
          </Button>
          <div className="flex-grow"></div>
          
          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                className="h-7 text-xs" 
                // Update disabled logic based on derived currentDirections
                disabled={isLoading || !!error || !currentDirections}
              >
                Start Navigation
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start Navigation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will open Google Maps in a new tab to start navigation to 
                  <span className="font-semibold"> {hospital?.name ?? 'the selected location'}</span>
                  {' '}using the <span className="font-semibold">{transportMode}</span> mode.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleNavigationConfirm}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </>
  );
} 