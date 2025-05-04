import type { Hospital, Directions } from "@/types/hospital"
import type mapboxgl from 'mapbox-gl';
import type { SkyLayerSpecification, FillExtrusionLayerSpecification, Expression, CameraOptions } from 'mapbox-gl';

// Define interface for specific view params (optional)
interface HospitalViewParams extends Partial<Pick<CameraOptions, 'zoom' | 'pitch' | 'bearing'>> {
  coordinates?: [number, number]; // Optional coordinate override
  // Add speed, curve etc. if needed: speed?: number;
}

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

export const baseHospitalData: Array<{ id: number; name: string; queryHint: string }> = [
  { id: 1, name: "Chestnut Hill", queryHint: "Chestnut Hill Medical Center, 25 Boylston St, Chestnut Hill, MA 02467" },
  { id: 2, name: "20 Patriot Place", queryHint: "Mass General Brigham Urgent Care, 20 Patriot Pl, Foxborough, MA 02035" },
  { id: 3, name: "22 Patriot Place", queryHint: "Brigham Health Care Center, Multispecialty Clinic, 22 Patriot Pl 3rd Floor, Foxborough, MA 02035" },
  { id: 4, name: "Faulkner", queryHint: "Brigham and Women's Faulkner Hospital, 1153 Centre St, Jamaica Plain, MA 02130" },
  { id: 0, name: "Main Campus", queryHint: "Brigham and Women's Hospital, 75 Francis St, Boston, MA 02115" },
]

export const MAPBOX_WORKER_COUNT = 4;

export const MAP_LAYER_IDS = {
  SOURCE: 'routes-source',
  INACTIVE_CASING: 'routes-inactive-casing',
  ACTIVE_CASING: 'routes-active-casing',
  INACTIVE_ROUTE: 'routes-inactive',
  ACTIVE_ROUTE: 'routes-active',
  SKY: 'sky',
  BUILDINGS: '3d-buildings',
};

export const MAP_LAYER_BEFORE_ID = 'road-label';

export const MAP_POPUP_OPTIONS = {
  offset: 25,
  maxWidth: '240px',
};

export const ROUTE_FIT_BOUNDS_OPTIONS = {
  padding: { top: 100, bottom: 150, left: 460, right: 100 },
  pitch: 45,
  duration: 1500,
};

export const DEFAULT_FLY_TO_OPTIONS = {
  pitch: 70,
  speed: 1.8,
  curve: 1.42,
  zoom: 18,
};

// Define the new map for specific hospital views
export const HOSPITAL_SPECIFIC_VIEWS: Record<number, HospitalViewParams> = {
  // Example: Replicate Chestnut Hill view
  1: {
    coordinates: [-71.167169, 42.323224],
    zoom: 19.56,
    pitch: 71.00,
    bearing: 16.00,
  },
  // Add entries for other hospitals here if needed, e.g.:
  // 4: { zoom: 17.5, pitch: 65 }, // Faulkner example
};

export const SKY_LAYER_CONFIG: SkyLayerSpecification = {
  id: MAP_LAYER_IDS.SKY,
  type: 'sky',
  paint: {
    'sky-type': 'atmosphere',
    'sky-atmosphere-sun': [0.0, 0.0],
    'sky-atmosphere-sun-intensity': 15,
  },
};

export const BUILDINGS_LAYER_CONFIG: FillExtrusionLayerSpecification = {
  id: MAP_LAYER_IDS.BUILDINGS,
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'] as Expression,
  type: 'fill-extrusion',
  minzoom: 15,
  paint: {
    'fill-extrusion-color': '#aac7e9',
    'fill-extrusion-height': [
      'interpolate', ['linear'], ['zoom'],
      15, 0, 15.5, ['get', 'height']
    ] as Expression,
    'fill-extrusion-base': [
      'interpolate', ['linear'], ['zoom'],
      15, 0, 15.5, ['get', 'min_height']
    ] as Expression,
    'fill-extrusion-opacity': 0.8
  }
};

export const CONGESTION_COLORS: Record<string, string> = {
  low: '#0059b3',
  moderate: '#ffa500',
  heavy: '#ff4500',
  severe: '#b22222',
  unknown: '#0059b3',
};

export const CONGESTION_TEXT_COLORS: Record<string, string> = {
  low: 'text-green-600',
  moderate: 'text-orange-500',
  heavy: 'text-red-600',
  severe: 'text-red-800',
  unknown: 'text-gray-500',
};

export const MAPBOX_DIRECTIONS_ANNOTATIONS = 'duration,distance,congestion';

export const GOOGLE_PLACES_FIELDS = {
  DETAILS: 'name,formatted_address,international_phone_number,website,geometry,opening_hours,place_id',
  GEOMETRY: 'geometry',
  PLACE_ID: 'place_id',
};

export const CONVERSION_FACTORS = {
  METERS_TO_MILES: 0.000621371,
};
export const EARTH_RADIUS_MILES = 3958.8;
export const AUTOCOMPLETE_DEBOUNCE_WAIT = 300;
export const AUTOCOMPLETE_MIN_CHARS = 2;
export const HOSPITAL_STATUS_PRIORITIES = {
  OPEN: 0,
  UNKNOWN: 1,
  CLOSED: 2,
};

export const LAYOUT_DIMENSIONS = {
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 420,
  SIDEBAR_PADDING_X: '0.75rem',
  SIDEBAR_PADDING_Y: '1rem',
  SIDEBAR_TRANSITION_MS: 300,
};

export const DEFAULT_AVATAR_PATH = "/vibrant-street-market.png";
export const HOSPITAL_LOGO_PATH = "/bwh-logo-icon.svg";

export const UI_PLACEHOLDERS = {
  LOCATION_SEARCH: "Enter your location",
  HOSPITAL_SEARCH: "Search hospitals...",
};

export const MAPBOX_SUPPORT_REASONS = {
  NO_WEBGL: "Your browser doesn't support WebGL, which is required for Mapbox GL.",
  WEBGL_DISABLED: "Your browser supports WebGL, but it may be disabled or unavailable.",
  UNKNOWN: "Mapbox GL isn't supported by your browser for an unknown reason.",
};
