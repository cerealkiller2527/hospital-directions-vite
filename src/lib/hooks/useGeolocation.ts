"use client"

import { useState, useCallback, useEffect } from "react";

interface GeolocationState {
  location: [number, number] | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook to get user's current location using the Geolocation API
 */
export function useGeolocation(options?: PositionOptions): GeolocationState & { getCurrentPosition: () => void } {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: [position.coords.longitude, position.coords.latitude],
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({
          location: null,
          error: `Error getting location: ${err.message}`,
          loading: false,
        });
      },
      options
    );
  }, [options]);

  return { ...state, getCurrentPosition };
} 