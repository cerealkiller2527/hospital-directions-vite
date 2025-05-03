import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Hospital } from '@/types/hospital';
import { useMap } from '@/contexts/MapContext';
import { LocationCard } from './LocationCard'; // Assuming LocationCard is in the same directory
import { EmptySearchResults } from './EmptySearchResults'; // Assuming EmptySearchResults is here too
import { icons, hospitalIconMapping } from '@/lib/icons'; // Import centralized icons map and ID mapping
import { Hospital as HospitalIcon } from 'lucide-react'; // Import fallback icon

// Hospital List Component Props
interface HospitalListProps {
  hospitals: Hospital[];
  searchQuery: string;
  onClearSearch: () => void;
  onSelectItem?: (hospital: Hospital) => void;
  onViewDirections?: (hospital: Hospital) => void;
  className?: string;
  // iconMapping is no longer needed here, but keep if logic requires it elsewhere
}

// Hospital List Component
export function HospitalList({
  hospitals,
  searchQuery,
  onClearSearch,
  onSelectItem,
  onViewDirections,
  className,
}: HospitalListProps) {
  const { selectedLocation } = useMap();

  const sortedHospitals = useMemo(() => {
    // Ensure hospitals is always an array before sorting
    const hospitalsArray = Array.isArray(hospitals) ? hospitals : [];
    return [...hospitalsArray].sort((a, b) => a.name.localeCompare(b.name));
  }, [hospitals]);

  // Ensure hospitals is an array for the length check
  if ((!Array.isArray(hospitals) || hospitals.length === 0) && searchQuery) {
    return <EmptySearchResults onClear={onClearSearch} />;
  }

  return (
    <div className={cn("flex flex-col gap-2 p-1 pb-4", className)}>
      {sortedHospitals.map((hospital) => {
        // Determine the icon component for this hospital
        const iconName = hospitalIconMapping[hospital.id] || 'hospital';
        const CardIcon = icons[iconName] || HospitalIcon; // Use centralized map + fallback
        
        return (
          <LocationCard
            key={hospital.id}
            location={hospital}
            isSelected={selectedLocation?.id === hospital.id}
            onClick={onSelectItem ? () => onSelectItem(hospital) : undefined}
            searchQuery={searchQuery}
            onViewDirections={onViewDirections ? () => onViewDirections(hospital) : undefined}
            // Pass the determined component
            IconComponent={CardIcon} 
          />
        );
      })}
    </div>
  );
} 