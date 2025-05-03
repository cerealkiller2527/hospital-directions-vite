export interface Hospital {
  id: number
  name: string
  address?: string
  coordinates?: [number, number] // [lng, lat]
  phone?: string
  isOpen?: boolean

  // Google Places specific fields (optional)
  placeId?: string
  website?: string
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
