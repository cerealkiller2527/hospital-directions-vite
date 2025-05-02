# Mapbox Integration

This project uses Mapbox GL JS for all mapping features.

## Key Files

- `src/lib/mapbox.ts` - Core configuration and constants
- `src/lib/services/mapbox-service.ts` - Initialization and utility functions
- `src/components/map/MapErrorBoundary.tsx` - Error handling for map components
- `src/components/map/MapTest.tsx` - Test component for verifying Mapbox setup

## Setup for Development

1. Get a Mapbox access token from https://account.mapbox.com/
2. Create a `.env` file in the project root
3. Add your token: `VITE_MAPBOX_ACCESS_TOKEN=your_token_here`

## Available Map Styles

The following map styles are available through the `MAP_STYLES` object:

- `streets` (default) - Standard street map
- `outdoors` - Topographic street map
- `light` - Light color theme
- `dark` - Dark color theme
- `satellite` - Satellite imagery
- `satelliteStreets` - Satellite imagery with street overlays
- `navigationDay` - Navigation-focused map for daytime
- `navigationNight` - Navigation-focused map for nighttime

## Common Issues

- If the map doesn't load, check browser console for WebGL errors
- Ensure your token has the required scopes (minimal: styles:read)
- Some browsers may have WebGL disabled or restricted

## Implementation Notes

- The map is initialized in a React ref with proper cleanup on unmount
- All map interactions should be done through the MapContext
- Use the MapErrorBoundary component to handle map errors gracefully

## Next Steps

After Phase 1 (basic setup), the implementation will continue with:

1. Refactoring the MapProvider to use real Mapbox instances
2. Implementing hospital markers using Mapbox markers
3. Adding geocoding and search functionality
4. Implementing route directions and visualization 