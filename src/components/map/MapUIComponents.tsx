"use client"

import React, { useState, useMemo } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  ExternalLink,
  Search,
  X,
  Volume2,
  ArrowRight,
  Car,
  Train,
  Loader2,
  FootprintsIcon as Walking,
  Hospital as HospitalIcon,
  Stethoscope,
  HeartPulse,
  Activity,
  SquareUserRound,
  type Icon as LucideIconType,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Hospital, Directions, TransportMode } from "@/types/hospital";
import type { EnrichedRoute } from "@/lib/services/directions";
import { useMap } from "@/contexts/MapContext";
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

// Map icon names to components
// The type should be the React component type, not the imported type alias
const icons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  hospital: HospitalIcon,
  stethoscope: Stethoscope,
  'heart-pulse': HeartPulse,
  activity: Activity,
  'square-user-round': SquareUserRound,
};

// Highlight Text Component
export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${query.trim()})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-100 dark:bg-yellow-900">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

// Empty Search Results Component
export function EmptySearchResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-1">No hospitals found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}

// Location Card Component Props
interface LocationCardProps {
  location: Hospital;
  isSelected?: boolean;
  onClick?: (hospital: Hospital) => void;
  searchQuery?: string;
  onViewDirections?: () => void;
  className?: string;
  iconName: string;
}

// Location Card Component
export function LocationCard({
  location,
  isSelected = false,
  onClick,
  searchQuery = "",
  onViewDirections,
  className,
  iconName,
}: LocationCardProps) {
  const { flyTo } = useMap();
  const [isHovered, setIsHovered] = useState(false);

  const statusColor = location.isOpen === true ? "bg-green-100 text-green-700" : location.isOpen === false ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";
  const statusText = location.isOpen === true ? "Open Now" : location.isOpen === false ? "Closed" : "Hours vary";

  const IconComponent = icons[iconName] || HospitalIcon;

  const handleClick = () => {
    if (onClick) {
      onClick(location);
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg border transition-shadow duration-200 cursor-pointer",
        isSelected && "ring-1 ring-primary shadow-md",
        isHovered && "shadow-sm",
        className,
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ padding: 8 }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <IconComponent className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate mb-1">
              {searchQuery ? <HighlightText text={location.name} query={searchQuery} /> : location.name}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {searchQuery ? <HighlightText text={location.address || 'N/A'} query={searchQuery} /> : (location.address || 'Address unavailable')}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-muted-foreground">
            <Phone className="mr-1 h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{location.phone || 'N/A'}</span>
          </div>
          <div className={cn("flex items-center justify-center px-1.5 py-0.5 rounded-full text-center", statusColor)}>
            <Clock className="mr-1 h-2.5 w-2.5 flex-shrink-0" />
            <span>{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hospital List Component Props
interface HospitalListProps {
  hospitals: Hospital[];
  searchQuery: string;
  onClearSearch: () => void;
  onSelectItem?: (hospital: Hospital) => void;
  onViewDirections?: (hospital: Hospital) => void;
  className?: string;
  iconMapping: Record<number, string>;
}

// Hospital List Component
export function HospitalList({
  hospitals,
  searchQuery,
  onClearSearch,
  onSelectItem,
  onViewDirections,
  className,
  iconMapping,
}: HospitalListProps) {
  const { selectedLocation } = useMap();

  const sortedHospitals = useMemo(() => {
    return [...hospitals].sort((a, b) => a.name.localeCompare(b.name));
  }, [hospitals]);

  if (hospitals.length === 0 && searchQuery) {
    return <EmptySearchResults onClear={onClearSearch} />;
  }

  return (
    <div className={cn("flex flex-col gap-2 p-1 pb-4", className)}>
      {sortedHospitals.map((hospital) => (
        <LocationCard
          key={hospital.id}
          location={hospital}
          isSelected={selectedLocation?.id === hospital.id}
          onClick={onSelectItem ? () => onSelectItem(hospital) : undefined}
          searchQuery={searchQuery}
          onViewDirections={onViewDirections ? () => onViewDirections(hospital) : undefined}
          iconName={iconMapping[hospital.id] || 'hospital'}
        />
      ))}
    </div>
  );
}

// Search Input Component
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="text"
          placeholder={placeholder}
          className="w-full pl-9 pr-9 h-10 text-base bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

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

// Directions Panel Component
export function DirectionsPanel({
  directions,
  className,
}: {
  directions: Directions;
  className?: string;
}) {
  return (
    <ScrollArea className={cn("flex-1", className)} style={{ paddingRight: 8 }}>
      <div className="flex flex-col gap-2 pb-2">
        {directions.steps.map((step, index) => (
          <div key={index} className="relative pl-7 pb-2">
            {index < directions.steps.length - 1 && (
              <div className="absolute left-[10px] top-5 bottom-0 w-[1.5px] bg-primary/20" />
            )}
            <div className="flex items-start">
              <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {index + 1}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs">{step.instruction}</p>
                <p className="text-xs text-muted-foreground">
                  {step.distance} • {step.duration}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div className="relative pl-7">
          <div className="flex items-start">
            <div className="absolute left-0 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
            <p className="text-xs font-medium">Arrive at destination</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

interface DirectionsCardProps {
  hospital: Hospital | null;
  directions: Directions | null;
  isLoading: boolean;
  error: string | null;
  allRoutes: EnrichedRoute[] | null;
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
  directions,
  isLoading,
  error,
  allRoutes,
  onSelectRoute,
  className,
}: DirectionsCardProps) {
  const { transportMode } = useMap();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // State for dialog

  const currentRoute = allRoutes?.find(r => r.isActive);
  const estimatedTime = currentRoute?.directions.duration ?? "-";
  const distance = currentRoute?.directions.distance ?? "-";
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
                 currentRoute ? `${estimatedTime} ${transportMode} • ${distance}` : 
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
            {!isLoading && !error && currentRoute?.directions && (
              <DirectionsPanel directions={currentRoute.directions} />
            )}
            {!isLoading && !error && !currentRoute && !hospital && (
              <div className="text-center py-8 text-sm text-muted-foreground flex items-center justify-center flex-1 h-full">
                Select a hospital to view directions.
              </div>
            )}
            {!isLoading && !error && !currentRoute && hospital && (
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
                disabled={isLoading || !!error || !currentRoute}
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