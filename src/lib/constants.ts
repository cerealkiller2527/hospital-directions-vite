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

// Mock hospital data
export const hospitalLocations: Hospital[] = [
  {
    id: 1,
    name: "Chestnut Hill",
    address: "123 Main Street",
    coordinates: [-73.9857, 40.7484],
    phone: "(555) 123-4567",
    hours: "24/7 Emergency Services",
    distance: "2.4 miles",
    estimatedTime: "12 min",
    specialties: ["Emergency Care", "Surgery", "Cardiology"],
    isOpen: true,
  },
  {
    id: 2,
    name: "22 Patriot",
    address: "456 Park Avenue",
    coordinates: [-73.9654, 40.7829],
    phone: "(555) 234-5678",
    hours: "Mon-Fri: 8am-8pm, Sat-Sun: 9am-5pm",
    distance: "3.7 miles",
    estimatedTime: "18 min",
    specialties: ["Pediatrics", "Orthopedics", "Neurology"],
    isOpen: true,
  },
  {
    id: 3,
    name: "20 Patriot",
    address: "789 Broadway",
    coordinates: [-73.94, 40.73],
    phone: "(555) 345-6789",
    hours: "Mon-Fri: 7am-9pm, Sat: 8am-6pm, Sun: Closed",
    distance: "1.2 miles",
    estimatedTime: "8 min",
    specialties: ["Family Medicine", "Women's Health", "Mental Health"],
    isOpen: true,
  },
  {
    id: 4,
    name: "West Community Hospital",
    address: "321 Hudson Street, West Side",
    coordinates: [-74.006, 40.726],
    phone: "(555) 456-7890",
    hours: "24/7 Emergency Services",
    distance: "4.5 miles",
    estimatedTime: "22 min",
    specialties: ["Trauma Center", "Oncology", "Rehabilitation"],
    isOpen: true,
  },
]

export const mockDirections: Directions = {
  steps: [
    {
      instruction: "Head south on Broadway toward W 45th St",
      distance: "0.2 miles",
      duration: "1 min",
    },
    {
      instruction: "Turn right onto W 42nd St",
      distance: "0.5 miles",
      duration: "3 min",
    },
    {
      instruction: "Turn left onto 5th Ave",
      distance: "0.8 miles",
      duration: "4 min",
    },
    {
      instruction: "Continue onto Park Ave",
      distance: "0.6 miles",
      duration: "3 min",
    },
    {
      instruction: "Turn right onto E 34th St",
      distance: "0.3 miles",
      duration: "1 min",
    },
  ],
}
