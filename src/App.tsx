"use client"

import { useState, useMemo, useCallback } from "react"
import { Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHospitalSearch } from "@/lib/hooks"
import { hospitalLocations, mockDirections } from "@/lib/constants"
import { AppHeader, SidebarContainer } from "@/components/Layout"
import {
  MapProvider,
  MapControls,
  MapMarkers,
  DistanceInfo,
  HospitalList,
  SearchInput,
  DirectionsCard,
} from "@/components/map/Map"

export default function App() {
  // State management
  const [activeTab, setActiveTab] = useState<"list" | "directions">("list")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Custom hooks
  const { searchQuery, setSearchQuery, filteredHospitals } = useHospitalSearch(hospitalLocations)

  // Event handlers
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [setSearchQuery])

  // Sidebar content
  const sidebarContent = useMemo(
    () => (
      <div className="flex flex-col gap-4">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search hospitals..." />

        <Button size="sm" className="h-10 gap-1 w-full text-sm">
          <Navigation className="h-4 w-4" />
          <span>My Location</span>
        </Button>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "list" | "directions")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="directions">Directions</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-2">
            <HospitalList hospitals={filteredHospitals} searchQuery={searchQuery} onClearSearch={handleClearSearch} />
          </TabsContent>
          <TabsContent value="directions">
            <DirectionsCard hospital={hospitalLocations[0]} directions={mockDirections} />
          </TabsContent>
        </Tabs>
      </div>
    ),
    [activeTab, filteredHospitals, handleClearSearch, searchQuery, setSearchQuery],
  )

  return (
    <MapProvider initialHospital={hospitalLocations[0]}>
      <div className="relative min-h-screen overflow-hidden">
        {/* Header */}
        <AppHeader isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        {/* Main content */}
        <div className="relative pt-16 min-h-screen">
          {/* Sidebar */}
          <SidebarContainer isOpen={sidebarOpen}>{sidebarContent}</SidebarContainer>

          {/* Map background */}
          <div className="fixed inset-0 z-0">
            <img src="/map-background.png" alt="Map" className="w-full h-full object-cover" />
          </div>

          {/* Map components */}
          <MapMarkers hospitals={hospitalLocations} />
          <MapControls />
          <DistanceInfo />
        </div>
      </div>
    </MapProvider>
  )
}
