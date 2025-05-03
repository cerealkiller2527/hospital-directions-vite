import React, { useState } from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Hospital } from '@/types/hospital';
import { HighlightText } from '@/components/shared/HighlightText'; // Adjusted import path
// Import the base hospital icon as a fallback
import { Hospital as HospitalIcon } from 'lucide-react';

// Location Card Component Props
interface LocationCardProps {
  location: Hospital;
  isSelected?: boolean;
  onClick?: (hospital: Hospital) => void;
  searchQuery?: string;
  onViewDirections?: () => void; // Keep this if needed
  className?: string;
  // Change prop to accept the component directly
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

// Location Card Component
export function LocationCard({
  location,
  isSelected = false,
  onClick,
  searchQuery = "",
  onViewDirections, // Keep this if needed
  className,
  IconComponent = HospitalIcon, // Default to HospitalIcon if not provided
}: LocationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColor = location.isOpen === true ? "bg-green-100 text-green-700" : location.isOpen === false ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";
  const statusText = location.isOpen === true ? "Open Now" : location.isOpen === false ? "Closed" : "Hours vary";

  // No need to lookup icon component anymore
  // const IconComponent = icons[iconName] || HospitalIcon;

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
            {/* Use the passed IconComponent */}
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