import React from 'react';
import { ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Directions } from "@/types/hospital";

// Directions Panel Component
export function DirectionsPanel({
  directions,
  className,
}: {
  directions: Directions;
  className?: string;
}) {
  return (
    <ScrollArea className={cn("flex-1", className)} style={{ paddingRight: 8 }}>
      <div className="flex flex-col gap-2 pb-2">
        {directions.steps.map((step, index) => (
          <div key={index} className="relative pl-7 pb-2">
            {index < directions.steps.length - 1 && (
              <div className="absolute left-[10px] top-5 bottom-0 w-[1.5px] bg-primary/20" />
            )}
            <div className="flex items-start">
              <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {index + 1}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs">{step.instruction}</p>
                <p className="text-xs text-muted-foreground">
                  {step.distance} • {step.duration}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div className="relative pl-7">
          <div className="flex items-start">
            <div className="absolute left-0 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
              <ArrowRight className="h-3 w-3" />
            </div>
            <p className="text-xs font-medium">Arrive at destination</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
} 