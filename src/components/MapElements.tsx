import React from 'react';
import mapboxgl from 'mapbox-gl';
import { LocationMarker } from "@/components/map/LocationMarker";
import { LocationPopup } from "@/components/map/LocationPopup";
import { UserLocationMarker } from "@/components/map/UserLocationMarker";
import { MapControls } from "@/components/map/MapControls";
import { RouteInfoCard } from "@/components/map/ui/RouteInfoCard";
import { hospitalIconMapping } from '@/lib/icons';
import type { Hospital } from "@/types/hospital";
import type { EnrichedRoute } from '@/lib/services/directions'; // Assuming useAppMapData type is accessible or defined elsewhere
import { useAppMapData } from "@/lib/hooks/useAppMapData"; // Import if using the return type directly

// Keep props interface exported
export interface MapElementsProps {
  mapInstance: mapboxgl.Map | null;
  hospitalsLoading: boolean;
  processedHospitals: Hospital[];
  popupLocation: Hospital | null;
  // Use the type from useAppMapData for consistency if possible
  currentRoute: ReturnType<typeof useAppMapData>['currentRoute']; 
  handleViewDirections: (hospital: Hospital) => void;
}

export function MapElements({
  mapInstance,
  hospitalsLoading,
  processedHospitals,
  popupLocation,
  currentRoute,
  handleViewDirections
}: MapElementsProps) {
  return (
    <>
      {/* Render Markers */}
      {mapInstance && !hospitalsLoading && processedHospitals.map((hospital) =>
        hospital.coordinates ? (
          <LocationMarker
            key={hospital.id}
            hospital={hospital}
            iconName={hospitalIconMapping[hospital.id] || 'hospital'}
          />
        ) : null
      )}
      {/* Render User Location */}
      {mapInstance && <UserLocationMarker />}
      {/* Render Popup */}
      {popupLocation && (
        <LocationPopup
          location={popupLocation}
          onViewDirections={handleViewDirections}
          iconName={hospitalIconMapping[popupLocation.id] || 'hospital'}
        />
      )}
      {/* Render Controls */}
      {mapInstance && <MapControls />}
      {/* Render Route Info Card */}
      <RouteInfoCard
        route={currentRoute}
        className="absolute top-4 right-4 z-10"
      />
    </>
  );
} 