export interface Coordinates {
  lat: number
  lng: number
}

export interface Hospital {
  id: number
  name: string
  address: string
  coordinates: [number, number]
  phone: string
  hours: string
  distance: string
  estimatedTime: string
  specialties: string[]
  isOpen?: boolean
}

export interface DirectionStep {
  instruction: string
  distance: string
  duration: string
}

export interface Directions {
  steps: DirectionStep[]
}

export type TransportMode = "drive" | "walk" | "transit"
