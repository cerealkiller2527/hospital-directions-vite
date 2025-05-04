import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LAYOUT_DIMENSIONS, Z_INDEX } from "@/lib/constants";

interface SidebarToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SidebarToggleButton({ isOpen, onToggle }: SidebarToggleButtonProps) {
  // Define sidebar width as a CSS variable or directly use the value
  // Using value directly for simplicity here
  const sidebarWidthPx = `${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px`;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className={cn(
        // Position absolutely relative to parent (SidebarContainer)
        // Adjust top position to account for parent's padding-top (1rem)
        `absolute top-[1rem] left-full ml-3 z-10`,
        "h-10 w-10 rounded-md shadow-md", // Standard sizing and shadow
        "bg-background hover:bg-primary hover:text-primary-foreground text-primary",
        // Remove transform transition - it moves with the parent now
        // "transition-transform duration-300 ease-in-out", 
        // Remove transform based on isOpen state
        // isOpen && `translate-x-[${sidebarWidthPx}]` 
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
} 