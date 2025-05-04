// Mapbox GL configuration and constants
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Validate access token
if (!MAPBOX_ACCESS_TOKEN) {
  console.error('Missing Mapbox access token. Set VITE_MAPBOX_ACCESS_TOKEN in your .env file.');
}

// Default map style
export const MAP_STYLE = 'mapbox://styles/mapbox/streets-v11';

// Available map styles
export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v11',
  light: 'mapbox://styles/mapbox/light-v10',
  dark: 'mapbox://styles/mapbox/dark-v10',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11',
  navigationDay: 'mapbox://styles/mapbox/navigation-day-v1',
  navigationNight: 'mapbox://styles/mapbox/navigation-night-v1'
};

// Default map configuration
export const DEFAULT_MAP_VIEW = { // Fork Factory Brook Reservation
  center: [-71.146450, 42.274798],
  minZoom: 8,
  zoom: 11.59,
  pitch: 65.51,
  maxZoom: 22,
  bearing: 165.55
}; 