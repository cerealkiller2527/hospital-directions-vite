import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMapboxSupportStatus } from '@/lib/services/mapbox-service';

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Map Error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const supportStatus = getMapboxSupportStatus();
      
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Map Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 text-muted-foreground">
                {supportStatus.supported === false 
                  ? supportStatus.reason 
                  : this.state.error?.message || "An error occurred loading the map."}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
              >
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
} 