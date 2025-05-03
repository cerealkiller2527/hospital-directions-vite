"use client"

import { useState, useCallback, useMemo } from "react"
import type { Hospital } from "@/types/hospital"

/**
 * Custom hook for hospital search functionality
 * Accepts the full list and the current search query
 */
export function useHospitalSearch(hospitals: Hospital[], searchQuery: string) {
  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return hospitals;

    const query = searchQuery.toLowerCase();
    // Filter only by name and address as requested
    return hospitals.filter(
      (hospital) =>
        hospital.name.toLowerCase().includes(query) ||
        (hospital.address && hospital.address.toLowerCase().includes(query)) // Add check for address existence
    );
  }, [hospitals, searchQuery]);

  return {
    filteredHospitals,
  };
} 