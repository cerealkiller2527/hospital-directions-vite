"use client"

import { useState, useCallback, useMemo } from "react"
import type { Hospital } from "@/types/hospital"

/**
 * Custom hook for hospital search functionality
 */
export function useHospitalSearch(hospitals: Hospital[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return hospitals;

    const query = searchQuery.toLowerCase();
    // Filter only by name and address as requested
    return hospitals.filter(
      (hospital) =>
        hospital.name.toLowerCase().includes(query) ||
        hospital.address.toLowerCase().includes(query)
        // Removed specialty filtering
        // || hospital.specialties.some((specialty) => specialty.toLowerCase().includes(query)),
    );
  }, [hospitals, searchQuery]);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    filteredHospitals,
  };
} 