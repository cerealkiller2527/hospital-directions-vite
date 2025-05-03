import React from 'react';
import {
  Hospital as HospitalIcon,
  Stethoscope,
  HeartPulse,
  Activity,
  SquareUserRound,
  type Icon as LucideIconType
} from "lucide-react";

// Map icon string names to actual Lucide React components
export const icons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  hospital: HospitalIcon,
  stethoscope: Stethoscope,
  'heart-pulse': HeartPulse,
  activity: Activity,
  'square-user-round': SquareUserRound,
};

// Define mapping from Hospital ID to Lucide icon name (string)
// Moved from constants.ts
export const hospitalIconMapping: Record<number, string> = {
  0: "hospital", // Main Campus
  1: "square-user-round", // Chestnut Hill
  2: "activity", // Patriot Place
  3: "stethoscope", // 22 Patriot Place
  4: "heart-pulse", // Faulkner
}; 