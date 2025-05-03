import { useState, useEffect, useCallback } from 'react';
import type { Hospital, TransportMode } from '@/types/hospital';
import { getDirections, type EnrichedRoute } from '@/lib/services/directions';

interface UseDirectionsState {
  allRoutes: EnrichedRoute[] | null;
  currentRoute: EnrichedRoute | null;
  isLoading: boolean;
  error: string | null;
}

interface UseDirectionsReturn extends UseDirectionsState {
  selectRoute: (route: EnrichedRoute) => void;
}

export function useDirections(
  origin: [number, number] | null, 
  destination: Hospital | null, 
  mode: TransportMode
): UseDirectionsReturn {
  
  const [state, setState] = useState<UseDirectionsState>({
    allRoutes: null,
    currentRoute: null,
    isLoading: false,
    error: null,
  });

  // Effect to fetch directions when inputs change
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts during fetch

    // Check if we have a destination but no origin
    if (destination?.coordinates && !origin) {
      setState({
        allRoutes: null,
        currentRoute: null,
        isLoading: false,
        error: "Please set your location to calculate directions.", // Specific error message
      });
      return; // Don't proceed to fetch
    }

    // Proceed if we have both origin and destination
    if (origin && destination?.coordinates) {
      const fetchRoute = async () => {
        setState({ allRoutes: null, currentRoute: null, isLoading: true, error: null }); // Reset state before fetching
        try {
          const result = await getDirections(origin, destination.coordinates as [number, number], mode);
          
          if (!isMounted) return; // Check if component is still mounted

          if (result.error) {
            setState({
              allRoutes: null,
              currentRoute: null,
              isLoading: false,
              error: result.error, // Use the error from the service
            });
          } else if (result.data && result.data.length > 0) {
            const updatedRoutes = result.data.map((r, idx) => ({ ...r, isActive: idx === 0 })); // Set first route active
            setState({
              allRoutes: updatedRoutes,
              currentRoute: updatedRoutes[0],
              isLoading: false,
              error: null,
            });
          } else {
            // Handle case where service returned no data but no specific error
            setState({
              allRoutes: null,
              currentRoute: null,
              isLoading: false,
              error: "Could not calculate directions for the selected mode.",
            });
          }
        } catch (err) {
          // Catch unexpected issues during the async operation itself
          console.error("Unexpected error during direction fetch:", err);
          if (!isMounted) return;
          setState({
            allRoutes: null,
            currentRoute: null,
            isLoading: false,
            error: "An unexpected error occurred fetching directions.",
          });
        }
      };

      fetchRoute();
      
      return () => { isMounted = false; }; // Cleanup function

    } else {
      // If origin or destination becomes invalid (or both are null), clear the state
      // Avoid clearing if only origin is missing (handled above)
      if (state.allRoutes !== null || state.currentRoute !== null || state.error !== null || state.isLoading !== false) {
          setState({ allRoutes: null, currentRoute: null, isLoading: false, error: null });
      }
    }
    // Depend on origin, destination ID (stable), and mode
  }, [origin, destination?.id, mode]); 

  // Callback to select a specific route
  const selectRoute = useCallback((route: EnrichedRoute) => {
    setState(prevState => ({
      ...prevState,
      currentRoute: route,
      // Update isActive flags in allRoutes
      allRoutes: prevState.allRoutes?.map(r => ({ ...r, isActive: r.id === route.id })) || null,
    }));
  }, []); // No dependencies needed as it only uses setState

  return {
    ...state,
    selectRoute,
  };
} 