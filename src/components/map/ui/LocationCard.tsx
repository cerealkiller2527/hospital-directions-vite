import type React from "react"
import { useState } from "react"
import { MapPin, Clock, Phone, Globe, Route, LocateFixed } from 'lucide-react' // Added LocateFixed for distance icon
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"; // Import Badge
import { cn } from "@/lib/utils"
import { shortenAddress } from "@/lib/utils"
import type { Hospital } from "@/types/hospital"
import { useMap } from "@/contexts/MapContext" // Corrected context import path
import { icons } from "@/lib/icons" // Import icons map
import { Hospital as HospitalIcon } from "lucide-react" // Import fallback icon

// Map icon names to components - Moved to icons.ts, removed from here

// Location Card Component Props
interface LocationCardProps {
  location: Hospital
  isSelected?: boolean
  onClick?: (hospital: Hospital) => void
  // Modified onViewDirections: It now expects the function passed from HospitalList/AppContent
  // which already knows the specific hospital.
  onViewDirections?: () => void
  className?: string
  iconName: string
  distanceMiles?: number | null; // Add distance prop
}

// Location Card Component
export function LocationCard({
  location,
  isSelected = false,
  onClick,
  onViewDirections, // Keep this name consistent with HospitalList usage
  className,
  iconName,
  distanceMiles, // Destructure distance prop
}: LocationCardProps) {
  const { flyTo } = useMap() // Keep flyTo if needed
  const [isHovered, setIsHovered] = useState(false)

  // Updated status logic and styling from snippet
  // TEMPORARILY REMOVE dark: prefixes to test light mode styles
  const statusColor =
    location.isOpen === true
      ? "bg-green-100 text-green-700"
      : location.isOpen === false
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700"; 

  const statusText = location.isOpen === true ? "Open Now" : location.isOpen === false ? "Closed" : "Hours vary"

  const IconComponent = icons[iconName] || HospitalIcon

  const handleClick = () => {
    if (onClick) {
      onClick(location)
    }
    // Default flyTo removed as per snippet logic (handled by onSelectItem in parent)
  }

  // Added Website button handler from snippet
  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (location.website) {
      window.open(location.website, "_blank", "noopener,noreferrer")
    }
  }

  // Updated Directions button handler from snippet
  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (onViewDirections) {
      onViewDirections() // Call the passed function directly
    }
  }

  // Format distance for display - always return a string
  const formattedDistance = distanceMiles !== null && distanceMiles !== undefined
      ? `${distanceMiles.toFixed(1)} mi`
      : "-- mi"; // Placeholder when distance is null/undefined

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer overflow-hidden border-primary/10",
        isSelected && "ring-1 ring-primary shadow-md",
        isHovered
          ? "shadow-md translate-y-[-2px] border-primary/30 bg-primary/[0.02]"
          : "hover:shadow-sm hover:border-primary/20",
        className,
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-2.5 space-y-2.5">
        {/* Top Section: Icon, Name, Address, and Distance Badge */}
        <div className="flex items-start gap-1.5">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 transition-colors",
              isHovered && "bg-primary/20",
            )}
          >
            <IconComponent className={cn("h-3.5 w-3.5 text-primary transition-transform", isHovered && "scale-110")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center gap-1">
              <h3 className={cn("font-semibold text-sm truncate transition-colors flex-shrink min-w-0 mr-1", isHovered && "text-primary")}>
                {location.name}
              </h3>
              {/* Always render Badge, use outline variant with custom text/border */}
              <Badge
                variant="outline"
                className="flex-shrink-0 whitespace-nowrap h-5 px-1.5 text-xs border-primary/40 text-primary/90"
              >
                <LocateFixed className="h-2.5 w-2.5 mr-1"/>
                {formattedDistance} {/* Display formatted distance or placeholder */}
              </Badge>
            </div>
            {/* Address - Use the imported shortenAddress utility */}
            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
              <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {shortenAddress(location.address)}
              </span>
            </div>
          </div>
        </div>

        {/* Details Section: Phone, Status */}
        <div className="grid grid-cols-2 gap-1.75 text-xs">
          <div className="flex items-center text-muted-foreground">
            <Phone className="mr-1 h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{location.phone || "N/A"}</span>
          </div>
          <div className={cn("flex items-center justify-center px-1.5 py-0.5 rounded-full text-center", statusColor)}>
            <Clock className="mr-1 h-2.5 w-2.5 flex-shrink-0" />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs w-full gap-1"
            onClick={handleDirectionsClick}
            disabled={!location.coordinates || !onViewDirections}
          >
            <Route className="h-3 w-3" />
            <span>Directions</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full gap-1 border-primary/30 hover:bg-primary/5 hover:text-primary"
            onClick={handleWebsiteClick}
            disabled={!location.website}
          >
            <Globe className="h-3 w-3" />
            <span>Website</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 