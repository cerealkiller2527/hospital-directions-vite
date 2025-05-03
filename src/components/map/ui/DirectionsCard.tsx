import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Clock, Volume2, Loader2, Route, Map, AlertTriangle, Play, Square, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";
import type { Hospital, Directions, TransportMode } from "@/types/hospital";
import type { EnrichedRoute } from "@/lib/services/directions";
import { useMap } from "@/contexts/MapContext";
import { TransportModeSelector } from './TransportModeSelector';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSpeechSynthesis } from '@/lib/hooks/useSpeechSynthesis';

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
  const { transportMode, setActiveTab } = useMap();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // --- State for Speech Synthesis --- MOVED TO HOOK
  // const [isPlaying, setIsPlaying] = useState(false);
  // const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  // const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  // const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(undefined);
  // const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null); 

  // Derive currentRoute and its directions
  const currentRoute = useMemo(() => allRoutes?.find(r => r.isActive), [allRoutes]);
  const currentDirections = currentRoute?.directions ?? null;
  const directionSteps = currentDirections?.steps ?? [];

  // --- Use the Speech Synthesis Hook ---
  const {
      isPlaying,
      currentStepIndex,
      availableVoices,
      selectedVoiceURI,
      setSelectedVoiceURI, // Get the setter
      togglePlayPause,     // Get the toggle function
      stopSpeech           // Get the stop function (optional but good practice)
  } = useSpeechSynthesis(directionSteps);

  const estimatedTime = currentDirections?.duration ?? "-";
  const distance = currentDirections?.distance ?? "-";
  const hospitalName = hospital?.name ?? "Selected Hospital";

  // --- Effect to get available voices --- MOVED TO HOOK
  // useEffect(() => { ... }, []);

  // --- Effect to handle speech playback based on state --- MOVED TO HOOK
  // useEffect(() => { ... }, [isPlaying, currentStepIndex, selectedVoiceURI, directionSteps, availableVoices]);

  // Effect for error toasts (keep, as it's related to directions fetching error)
  useEffect(() => {
    if (error) {
      const toastId = `directions-error-${error.toLowerCase().replace(/\s+/g, '-')}`;
      toast.error(error, { id: toastId, icon: <AlertTriangle className="h-4 w-4" /> });
    }
  }, [error]);

  const handleNavigationConfirm = () => {
    if (!hospital?.coordinates) return; 
    const [lng, lat] = hospital.coordinates;
    const travelMode = googleMapsTravelModes[transportMode];
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${travelMode}`;
    
    // Open Google Maps in new tab
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    
    // Switch to the Indoor tab
    setActiveTab("indoor"); 
    
    setIsConfirmOpen(false); // Close the dialog
  };

  // --- Audio Button Click Handler --- Use hook's function
  const handleAudioToggle = () => {
    togglePlayPause();
    // if (isPlaying) {
    //   window.speechSynthesis.cancel(); // Stop immediately
    //   setIsPlaying(false);
    //   setCurrentStepIndex(-1);
    //   utteranceRef.current = null;
    // } else {
    //   if (directionSteps.length > 0) {
    //     setCurrentStepIndex(0); // Start from the first step
    //     setIsPlaying(true);
    //   } else {
    //       toast.info("No directions steps available to read.", { icon: <Info className="h-4 w-4" /> });
    //   }
    // }
  };

  // --- Voice Selection Handler --- Use hook's setter
  const handleVoiceChange = (value: string) => {
    setSelectedVoiceURI(value);
    // // If playing, stop and restart with the new voice (optional, could just apply to next utterance)
    // if (isPlaying) {
    //     window.speechSynthesis.cancel();
    //     // Restart immediately by setting index (useEffect will pick it up)
    //     // Note: This might feel abrupt. Could alternatively just let the current one finish.
    //     setCurrentStepIndex(prev => prev); 
    // }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b pb-3 mb-2">
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
        <TransportModeSelector />
      </div>

      {/* Routes Section (keep) */}
      {!isLoading && !error && allRoutes && allRoutes.length > 1 && (
        <div className="mb-2 flex-shrink-0">
          <div className="flex items-center py-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
              <Route className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium ml-1.5 mr-2">Routes</span>
            <Separator className="flex-grow" decorative />
          </div>
          <div className="flex flex-col gap-1 px-1 mt-1">
            {allRoutes.map((route, index) => (
              <button
                key={route.id}
                onClick={() => onSelectRoute && onSelectRoute(route)}
                className={cn(
                  "w-full text-left p-1.5 rounded-md text-xs transition-colors",
                  "flex items-center",
                  route.isActive
                    ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                    : "hover:bg-secondary/50 text-muted-foreground",
                )}
                disabled={!onSelectRoute}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-medium mr-2 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex justify-between items-center w-full">
                  <span>
                    {transportMode === "drive" && route.duration_typical
                      ? `Typically ${Math.round(route.duration_typical / 60)} min`
                      : `${route.directions.duration}`}
                  </span>
                  <span className="font-normal">{route.directions.distance}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center py-1.5 mt-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
              <Map className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium ml-1.5 mr-2">Navigation</span>
            <Separator className="flex-grow" decorative />
          </div>
        </div>
      )}

      {/* Scrollable Direction Steps */}
      <ScrollArea className="flex-1 h-0 min-h-0">
        <div className="space-y-3 pr-2">
          {!error && currentRoute && directionSteps.map((step, index) => (
            <div key={index} className="flex items-start text-xs">
              <div className={cn(
                  "flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full mr-2 mt-0.5 transition-colors",
                  // Highlight the currently spoken step
                  isPlaying && index === currentStepIndex 
                    ? "bg-blue-500 text-white" 
                    : "bg-primary text-primary-foreground"
              )}>
                <span className="text-[10px] font-medium">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground/90 leading-tight">{step.instruction}</p>
                <p className="text-muted-foreground/80 leading-tight">{step.distance} ({step.duration})</p>
              </div>
            </div>
          ))}
           {/* Display message if no steps but route exists */}
           {!isLoading && !error && currentRoute && directionSteps.length === 0 && (
               <p className="text-xs text-muted-foreground p-4 text-center">No detailed steps available for this route.</p>
           )}
        </div>
      </ScrollArea>

      {/* Footer with Audio Controls */}
      <CardFooter className="pt-2 px-3 flex-shrink-0 mt-3 gap-2 items-center">
        {/* Audio Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 border-primary border-2 h-7 text-xs"
          // Use hook handler
          onClick={handleAudioToggle}
          // Use hook state
          disabled={isLoading || !!error || !currentDirections || directionSteps.length === 0}
        >
          {/* Use hook state */}
          {isPlaying ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          {/* Use hook state */}
          {isPlaying ? "Stop" : "Audio"}
        </Button>

        {/* Voice Selector Dropdown */}
        <Select 
          // Use hook handler
          onValueChange={handleVoiceChange} 
          // Use hook state
          value={selectedVoiceURI}
          // Use hook state
          disabled={availableVoices.length === 0}
        >
          <SelectTrigger className="h-7 text-xs flex-grow min-w-0 w-auto px-2">
            {/* Use hook state */}
            <SelectValue placeholder={availableVoices.length > 0 ? "Default Voice" : "No voices available"} />
          </SelectTrigger>
          <SelectContent>
            {/* Use hook state */}
            {availableVoices.map((voice) => (
              <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs">
                {voice.name} ({voice.lang})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Navigation Button (no changes here) */}
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              size="sm" 
              className="h-7 text-xs flex-shrink-0" 
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
                <span className="font-semibold"> {hospitalName}</span>
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
    </div>
  );
} 