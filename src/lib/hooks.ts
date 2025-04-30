"use client"

import { useState, useCallback, useMemo } from "react"
import type { Hospital } from "@/types/hospital"

/**
 * Custom hook for hospital search functionality
 */
export function useHospitalSearch(hospitals: Hospital[]) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return hospitals

    const query = searchQuery.toLowerCase()
    return hospitals.filter(
      (hospital) =>
        hospital.name.toLowerCase().includes(query) ||
        hospital.address.toLowerCase().includes(query) ||
        hospital.specialties.some((specialty) => specialty.toLowerCase().includes(query)),
    )
  }, [hospitals, searchQuery])

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    filteredHospitals,
  }
}
