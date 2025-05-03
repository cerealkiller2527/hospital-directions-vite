import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Hospital } from '@/types/hospital';
import { useMap } from '@/contexts/MapContext';
import { LocationCard } from './LocationCard';
import { ScrollArea } from "@/components/ui/scroll-area";

// Import the extended type from App.tsx or define inline
interface HospitalWithDistance extends Hospital {
  distanceMiles?: number | null;
}

// Hospital List Component Props - Use the extended type
interface HospitalListProps {
  hospitals: HospitalWithDistance[]; // Expect hospitals with optional distance
  onSelectItem?: (hospital: Hospital) => void;
  onViewDirections?: (hospital: Hospital) => void;
  className?: string;
  iconMapping: Record<number, string>;
}

// Hospital List Component
export function HospitalList({
  hospitals,
  onSelectItem,
  onViewDirections,
  className,
  iconMapping,
}: HospitalListProps) {
  const { selectedLocation } = useMap();

  // Sorting is now done in AppContent, remove local sorting
  // const sortedHospitals = useMemo(() => { ... }, [hospitals]);

  return (
    <ScrollArea className="h-full">
      <div className={cn("flex flex-col gap-3 p-1 pb-4 pr-1", className)}>
        {/* Map over the already processed (sorted) hospitals */}
        {hospitals.map((hospital) => (
          <LocationCard
            key={hospital.id}
            location={hospital}
            isSelected={selectedLocation?.id === hospital.id}
            onClick={onSelectItem ? () => onSelectItem(hospital) : undefined}
            onViewDirections={onViewDirections ? () => onViewDirections(hospital) : undefined}
            iconName={iconMapping[hospital.id] || "hospital"}
            // Pass the distanceMiles prop
            distanceMiles={hospital.distanceMiles}
          />
        ))}
      </div>
    </ScrollArea>
  );
} 