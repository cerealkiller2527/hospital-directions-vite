import React from 'react';
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// Empty Search Results Component
export function EmptySearchResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-1">No hospitals found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
} 