import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Z_INDEX, LAYOUT_DIMENSIONS } from "@/lib/constants";

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarToggle({ isOpen, onToggle, className }: SidebarToggleProps) {
  const topPosition = `${LAYOUT_DIMENSIONS.HEADER_HEIGHT + 16}px`;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className={cn(
        "fixed z-50",
        "h-9 w-9 rounded-md shadow-md bg-card text-foreground",
        "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-lg",
        "active:scale-95",
        "transition-all duration-150 ease-in-out",
        className
      )}
      style={{
        top: topPosition,
        left: isOpen ? `${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH + 8}px` : '8px',
        zIndex: Z_INDEX.sidebar + 1,
      }}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
} 