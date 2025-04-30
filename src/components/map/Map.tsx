"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import {
  Plus,
  Minus,
  MapPin,
  Navigation,
  Clock,
  Phone,
  ExternalLink,
  Search,
  X,
  Volume2,
  ArrowRight,
} from "lucide-react"
import { Car, FootprintsIcon as Walking, Train } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Hospital, Directions, TransportMode } from "@/types/hospital"

// ==================== CONTEXT ====================

interface MapContextType {
  selectedLocation: Hospital | null
  setSelectedLocation: (hospital: Hospital) => void
  transportMode: TransportMode
  setTransportMode: (mode: TransportMode) => void
  zoom: number
  zoomIn: () => void
  zoomOut: () => void
  isMinZoom: boolean
  isMaxZoom: boolean
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function useMap() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}

interface MapProviderProps {
  children: ReactNode
  initialHospital?: Hospital | null
}

export function MapProvider({ children, initialHospital = null }: MapProviderProps) {
  const [selectedLocation, setSelectedLocation] = useState<Hospital | null>(initialHospital)
  const [transportMode, setTransportMode] = useState<TransportMode>("drive")
  const [zoom, setZoom] = useState(12)

  const zoomIn = useCallback(() => {
    if (zoom < 18) {
      setZoom((prevZoom) => Math.min(prevZoom + 1, 18))
    }
  }, [zoom])

  const zoomOut = useCallback(() => {
    if (zoom > 8) {
      setZoom((prevZoom) => Math.max(prevZoom - 1, 8))
    }
  }, [zoom])

  const value = {
    selectedLocation,
    setSelectedLocation,
    transportMode,
    setTransportMode,
    zoom,
    zoomIn,
    zoomOut,
    isMinZoom: zoom <= 8,
    isMaxZoom: zoom >= 18,
  }

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

// ==================== MAP COMPONENTS ====================

// Map Controls Component
export function MapControls() {
  const { zoomIn, zoomOut, isMinZoom, isMaxZoom } = useMap()

  return (
    <div className="absolute bottom-8 right-8 flex flex-col gap-2">
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
  )
}

// Map Markers Component
export function MapMarkers({ hospitals }: { hospitals: Hospital[] }) {
  const { selectedLocation } = useMap()

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Hospital location markers */}
      {hospitals.map((hospital, index) => (
        <div key={hospital.id} className={`absolute ${getMarkerPosition(index)} h-10 w-10 pointer-events-auto`}>
          <div className="absolute -translate-x-1/2 -translate-y-1/2">
            <div
              className={`h-6 w-6 rounded-full ${selectedLocation?.id === hospital.id ? "bg-accent" : "bg-primary"} flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg`}
            >
              {index + 1}
            </div>
            <div
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] ${selectedLocation?.id === hospital.id ? "border-t-accent" : "border-t-primary"} border-r-[6px] border-r-transparent`}
            ></div>
          </div>
        </div>
      ))}

      {/* User location marker */}
      <div className="absolute top-1/2 left-1/2 pointer-events-auto">
        <div className="absolute -translate-x-1/2 -translate-y-1/2">
          <div className="h-4 w-4 rounded-full bg-accent border-2 border-white shadow-lg"></div>
        </div>
      </div>
    </div>
  )
}

// Helper function to position markers
function getMarkerPosition(index: number): string {
  const positions = ["top-1/4 left-1/4", "top-1/3 right-1/3", "bottom-1/4 left-1/3", "bottom-1/3 right-1/4"]
  return positions[index % positions.length]
}

// Distance Info Component
export function DistanceInfo() {
  const { selectedLocation } = useMap()

  if (!selectedLocation) return null

  return (
    <Card className="absolute top-24 right-8 z-10 shadow-lg">
      <CardContent className="p-4">
        <p className="font-medium">Distance: {selectedLocation.distance}</p>
        <p className="text-muted-foreground text-sm">Est. travel time: {selectedLocation.estimatedTime} by car</p>
      </CardContent>
    </Card>
  )
}

// ==================== HOSPITAL COMPONENTS ====================

// Highlight Text Component
export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>

  const regex = new RegExp(`(${query.trim()})`, "gi")
  const parts = text.split(regex)

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
  )
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
  )
}

// Location Card Component
export function LocationCard({
  location,
  isSelected = false,
  onClick,
  searchQuery = "",
  className,
}: {
  location: Hospital
  isSelected?: boolean
  onClick?: () => void
  searchQuery?: string
  className?: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine status badge color based on whether the location is open
  const statusColor = location.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"

  return (
    <div
      className={cn(
        "bg-white rounded-lg border transition-shadow duration-200",
        isSelected && "ring-1 ring-primary shadow-md",
        isHovered && "shadow-sm",
        className,
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ padding: 8 }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate mb-1">
              {searchQuery ? <HighlightText text={location.name} query={searchQuery} /> : location.name}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {searchQuery ? <HighlightText text={location.address} query={searchQuery} /> : location.address}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("flex items-center gap-0.5 whitespace-nowrap text-xs ml-2", "bg-secondary/20 text-secondary")}
          >
            <Clock className="h-2.5 w-2.5" />
            {location.estimatedTime}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-muted-foreground">
            <Phone className="mr-1 h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{location.phone}</span>
          </div>
          <div className={cn("flex items-center px-1.5 py-0.5 rounded-full", statusColor)}>
            <Clock className="mr-1 h-2.5 w-2.5 flex-shrink-0" />
            <span>{location.isOpen ? "Open Now" : "Closed"}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2 mt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className={cn("h-7 gap-1 text-xs px-2 flex-1 mr-2", isHovered && "bg-gray-50")}
        >
          <ExternalLink className="h-3 w-3" />
          <span>Directory</span>
        </Button>
        <Button size="sm" className={cn("h-7 gap-1 text-xs px-2 flex-1", isSelected && "bg-primary")}>
          <Navigation className="h-3 w-3" />
          <span>Directions</span>
        </Button>
      </div>
    </div>
  )
}

// Hospital List Component
export function HospitalList({
  hospitals,
  searchQuery,
  onClearSearch,
  className,
}: {
  hospitals: Hospital[]
  searchQuery: string
  onClearSearch: () => void
  className?: string
}) {
  const { selectedLocation, setSelectedLocation } = useMap()

  // Sort hospitals by distance for better user experience
  const sortedHospitals = useMemo(() => {
    if (!hospitals.length) return []

    return [...hospitals].sort((a, b) => {
      const distA = Number.parseFloat(a.distance)
      const distB = Number.parseFloat(b.distance)
      return distA - distB
    })
  }, [hospitals])

  if (hospitals.length === 0) {
    return <EmptySearchResults onClear={onClearSearch} />
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {sortedHospitals.map((hospital) => (
        <LocationCard
          key={hospital.id}
          location={hospital}
          isSelected={selectedLocation?.id === hospital.id}
          onClick={() => setSelectedLocation(hospital)}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  )
}

// Search Input Component
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const handleClear = () => {
    onChange("")
  }

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
  )
}

// ==================== DIRECTIONS COMPONENTS ====================

// Transport Mode Selector Component
export function TransportModeSelector({ className }: { className?: string }) {
  const { transportMode, setTransportMode } = useMap()

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
  )
}

// Directions Panel Component
export function DirectionsPanel({
  directions,
  className,
}: {
  directions: Directions
  className?: string
}) {
  return (
    <ScrollArea className={cn("h-[250px]", className)} style={{ paddingRight: 8 }}>
      <div className="flex flex-col gap-2">
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
  )
}

// Main Directions Card Component
export function DirectionsCard({
  hospital,
  directions,
  className,
}: {
  hospital: Hospital
  directions: Directions
  className?: string
}) {
  const { transportMode } = useMap()

  return (
    <Card className={cn("bg-white border border-gray-100 shadow-sm", className)}>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm">Directions to {hospital.name}</CardTitle>
        <CardDescription>
          <div className="flex items-center text-xs">
            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
            <span>
              {hospital.estimatedTime} {transportMode} • {hospital.distance}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 px-3">
        <TransportModeSelector className="mb-2" />
        <DirectionsPanel directions={directions} />
      </CardContent>
      <CardFooter className="pt-2 px-3">
        <Button variant="outline" size="sm" className="flex items-center gap-1 border-primary border-2 h-7 text-xs">
          <Volume2 className="h-3 w-3" />
          Audio
        </Button>
        <div className="flex-grow"></div>
        <Button size="sm" className="h-7 text-xs">
          Start Navigation
        </Button>
      </CardFooter>
    </Card>
  )
}
