import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserLocationInput } from "@/components/map/ui/UserLocationInput";
import { HospitalList } from "@/components/map/ui/HospitalList";
import { DirectionsCard } from "@/components/map/ui/DirectionsCard";
import { hospitalIconMapping } from '@/lib/icons';
import type { Hospital } from "@/types/hospital";
import type { EnrichedRoute } from '@/lib/services/directions';

// Keep props interface exported
export interface SidebarContentProps {
  getCurrentPosition: () => void;
  geoLoading: boolean;
  geoError: string | null;
  activeTab: "list" | "directions" | "indoor";
  setActiveTab: (value: "list" | "directions" | "indoor") => void;
  processedHospitals: Hospital[];
  selectedLocation: Hospital | null;
  allRoutes: EnrichedRoute[] | null;
  directionsLoading: boolean;
  directionsError: string | null;
  hospitalsLoading: boolean;
  hospitalsError: string | null;
  handleViewDirections: (hospital: Hospital) => void;
  handleSelectHospitalFromList: (hospital: Hospital) => void;
  selectRoute: (route: EnrichedRoute) => void;
}

export function SidebarContent({
  getCurrentPosition,
  geoLoading,
  geoError,
  activeTab,
  setActiveTab,
  processedHospitals,
  selectedLocation,
  allRoutes,
  directionsLoading,
  directionsError,
  hospitalsLoading,
  hospitalsError,
  handleViewDirections,
  handleSelectHospitalFromList,
  selectRoute,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-4 px-1">
        <UserLocationInput
            getCurrentPosition={getCurrentPosition}
            isGeoLoading={geoLoading}
        />
        {geoError && <p className="text-xs text-red-600 text-center mt-1">{geoError}</p>}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "list" | "directions" | "indoor")}
        className="flex flex-col flex-1 h-0 min-h-0"
      >
        <TabsList className="grid w-full grid-cols-3 h-9 flex-shrink-0 mb-2">
          <TabsTrigger value="list" className="text-xs">List View</TabsTrigger>
          <TabsTrigger value="directions" className="text-xs">Directions</TabsTrigger>
          <TabsTrigger value="indoor" className="text-xs" disabled={!selectedLocation}>Indoor</TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent
          value="list"
          className="flex-1 h-0 min-h-0 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden"
        >
          {hospitalsLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-[110px] w-full" />
              <Skeleton className="h-[110px] w-full" />
              <Skeleton className="h-[110px] w-full" />
            </div>
          ) : hospitalsError ? (
            <div className="text-center py-8 text-sm text-red-600">{hospitalsError}</div>
          ) : (
            <div className="flex-1 h-0 min-h-0">
              <HospitalList
                hospitals={processedHospitals as any[]}
                onSelectItem={handleSelectHospitalFromList}
                onViewDirections={handleViewDirections}
                iconMapping={hospitalIconMapping}
              />
            </div>
          )}
        </TabsContent>

        {/* Directions Tab */}
        <TabsContent
          value="directions"
          className="flex-1 h-0 min-h-0 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden overflow-hidden"
        >
          <DirectionsCard
            hospital={selectedLocation}
            isLoading={directionsLoading}
            error={directionsError}
            allRoutes={allRoutes}
            onSelectRoute={selectRoute}
          />
        </TabsContent>

        {/* Indoor Tab */}
        <TabsContent
          value="indoor"
          className="flex-1 h-0 min-h-0 flex flex-col data-[state=active]:flex data-[state=inactive]:hidden p-4"
        >
          <h3 className="text-sm font-semibold mb-2">Indoor Path Planning</h3>
          {selectedLocation ? (
            <p className="text-xs text-muted-foreground">
              Indoor navigation for <span className="font-medium text-foreground">{selectedLocation.name}</span> will appear here.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Please select a hospital destination first.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 