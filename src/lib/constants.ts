import type { Hospital, Directions } from "@/types/hospital"

// Z-index values for consistent layering
export const Z_INDEX = {
  base: 0,
  map: 10,
  header: 20,
  sidebar: 30,
  modal: 40,
  toast: 50,
}

export const SPACING = {
  sm: "0.75rem",
}

// Base list of hospitals to fetch details for
// Using corrected names and query hints based on the provided image
export const baseHospitalData: Array<{ id: number; name: string; queryHint: string }> = [
  { id: 1, name: "Chestnut Hill", queryHint: "Chestnut Hill Medical Center, 25 Boylston St, Chestnut Hill, MA 02467" },
  { id: 2, name: "Patriot Place", queryHint: "20 Patriot Pl, Foxboro, MA 02035" }, // Assuming ID 2 corresponds to 20 Patriot Pl
  { id: 3, name: "22 Patriot Place", queryHint: "22 Patriot Pl, Foxboro, MA 02035" }, // Keep distinct entry based on image row 3
  { id: 4, name: "Faulkner", queryHint: "Faulkner Hospital, 1153 Centre St, Jamaica Plain, MA 02130" },
  { id: 0, name: "Main Campus", queryHint: "Mass General Brigham Healthcare Center (Chestnut Hill),850 Boylston St, Chestnut Hill, MA 02467" },
]

// Note: Old mock hospitalLocations and mockDirections are removed.
// Actual hospital data (coordinates, address, phone, hours) will be fetched using Google Places API.
