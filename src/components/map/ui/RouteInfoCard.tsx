import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Route, Clock, TrafficCone, Dot } from 'lucide-react'; // Added Dot for legend
import type { EnrichedRoute } from '@/lib/services/directions';
import { formatDurationFromSeconds } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface RouteInfoCardProps {
  route: EnrichedRoute | null;
  className?: string;
}

// Define congestion colors locally (or move to constants)
const congestionColors: Record<string, string> = {
  low: '#66cdaa',      // Medium Aquamarine (Greenish)
  moderate: '#ffa500',  // Orange
  heavy: '#ff4500',    // Orange Red
  severe: '#b22222',  // Firebrick (Dark Red)
  unknown: '#a0aec0', // Gray (fallback for missing/unknown)
};

// Define Tailwind text color classes corresponding to the hex colors for the summary
const congestionTextColors: Record<string, string> = {
  low: 'text-green-600',      
  moderate: 'text-orange-500',
  heavy: 'text-red-600',    
  severe: 'text-red-800', 
  unknown: 'text-gray-500', 
};

export function RouteInfoCard({ route, className }: RouteInfoCardProps) {
  if (!route) {
    return null; // Don't render if no route is selected
  }

  // Access properties from the correct locations
  const { distance, duration: formattedDurationString } = route.directions; // Formatted string
  const duration_seconds = route.duration; // Duration in seconds from root
  const typical_duration_seconds = route.duration_typical; // Typical duration in seconds from root
  const congestionData = route.congestion;

  let trafficDelaySeconds: number | null = null;
  if (typeof typical_duration_seconds === 'number' && typeof duration_seconds === 'number') {
    trafficDelaySeconds = duration_seconds - typical_duration_seconds;
    // Keep the negative check for calculation, but handle display below
    // if (trafficDelaySeconds < 0) trafficDelaySeconds = 0; 
  }

  // Format delays and total duration from seconds
  const formattedTrafficDelay = formatDurationFromSeconds(trafficDelaySeconds);
  const formattedTotalDurationFromSeconds = formatDurationFromSeconds(duration_seconds);
  
  const delayMinutes = trafficDelaySeconds !== null ? Math.round(trafficDelaySeconds / 60) : 0;
  
  // Determine traffic delay color - only apply if delay > 0
  let delayColor = 'text-green-600'; 
  if (delayMinutes >= 10) {
      delayColor = 'text-red-600';
  } else if (delayMinutes >= 5) {
      delayColor = 'text-orange-500';
  } else if (delayMinutes <= 0 && trafficDelaySeconds !== null) {
      delayColor = 'text-green-600'; // Explicitly green if no/negative delay
  } else if (trafficDelaySeconds === null) {
      delayColor = 'text-muted-foreground'; // Use muted if calculation not possible
  }

  // --- Calculate Congestion Summary --- 
  const congestionSummary = useMemo(() => {
    if (!congestionData || congestionData.length === 0) {
        return null;
    }
    const counts = { low: 0, moderate: 0, heavy: 0, severe: 0, unknown: 0 };
    let totalSegments = 0;
    congestionData.forEach(level => {
        if (level in counts) {
            counts[level as keyof typeof counts]++;
            totalSegments++;
        }
    });
    
    if (totalSegments === 0) return null; // Avoid division by zero
    
    return {
        low: Math.round((counts.low / totalSegments) * 100),
        moderate: Math.round((counts.moderate / totalSegments) * 100),
        heavy: Math.round((counts.heavy / totalSegments) * 100),
        severe: Math.round((counts.severe / totalSegments) * 100),
        // unknown: Math.round((counts.unknown / totalSegments) * 100), // Optional: show unknown %
    };

  }, [congestionData]);

  return (
    <Card className={cn("w-52 shadow-md border-primary/10 bg-background", className)}>
      <CardContent className="p-2.5 space-y-2.5">
        {/* Distance */}
        <div className="flex items-center text-sm">
          <Route className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span className="font-medium text-foreground/90">Distance:</span>
          <span className="ml-auto text-muted-foreground pl-1">{distance}</span>
        </div>

        {/* Total Duration */}
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span className="font-medium text-foreground/90">Duration:</span>
          {/* Use formatted seconds if available, otherwise fallback to the string */}
          <span className="ml-auto text-muted-foreground pl-1">
             {formattedTotalDurationFromSeconds !== '-- min' 
               ? formattedTotalDurationFromSeconds 
               : formattedDurationString} 
          </span>
        </div>

        {/* Traffic Delay */}
        <div className="flex items-center text-sm">
           <TrafficCone className={cn("h-4 w-4 mr-2 flex-shrink-0", delayColor)} />
           <span className={cn("font-medium", delayColor)}>Traffic:</span>
           <span className={cn("ml-auto pl-1 font-medium", delayColor)}>
             {trafficDelaySeconds === null ? 'N/A' : (delayMinutes > 0 ? `+${formattedTrafficDelay}` : 'No delay')}
           </span>
         </div>
         
        {/* --- Congestion Summary Section --- */}
        {congestionSummary && (
            <div className="pt-1 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Congestion (% of route):</p>
                <div className="flex flex-col gap-y-0.5 text-xs">
                   {(Object.keys(congestionSummary) as Array<keyof typeof congestionSummary>).map(level =>
                      congestionSummary[level] > 0 && (
                          <div key={level} className="flex items-center">
                               <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: congestionColors[level] }}></span>
                               <span className={cn("capitalize", congestionTextColors[level])}>{level}:</span>
                               <span className={cn("ml-auto font-medium", congestionTextColors[level])}>{congestionSummary[level]}%</span>
                          </div>
                      )
                   )}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
} 