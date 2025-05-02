export interface Coordinates {
  lat: number
  lng: number
}

// Type definition for Google Places opening hours periods
export interface PlaceOpeningHoursPeriod {
  open: { day: number; time: string };
  close?: { day: number; time: string }; // Optional for 24/7 places
}

// Type definition for Google Places opening hours
export interface PlaceOpeningHours {
  open_now?: boolean;
  periods?: PlaceOpeningHoursPeriod[];
  weekday_text?: string[];
}

export interface Hospital {
  id: number
  name: string
  address?: string
  coordinates?: [number, number]
  phone?: string
  hours?: string
  isOpen?: boolean

  // Google Places specific fields (optional)
  placeId?: string
  website?: string
  openingHours?: PlaceOpeningHours
}

export interface DirectionStep {
  instruction: string
  distance: string
  duration: string
}

export interface Directions {
  steps: DirectionStep[]
  distance?: string
  duration?: string
}

export type TransportMode = "drive" | "walk" | "transit"
