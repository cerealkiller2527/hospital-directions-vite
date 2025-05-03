"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, LocateFixed, Search, X, Info, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useMap } from '@/contexts/MapContext';
import { getPlaceAutocomplete, getCoordsFromPlaceId, type AutocompleteSuggestion } from '@/lib/services/google-places-service';
import { debounce } from '@/lib/utils';
import { toast } from "sonner";
import { AUTOCOMPLETE_DEBOUNCE_WAIT, AUTOCOMPLETE_MIN_CHARS, UI_PLACEHOLDERS } from '@/lib/constants';

interface UserLocationInputProps {
  getCurrentPosition: () => void; // Function to trigger geolocation
  isGeoLoading: boolean; // Is geolocation currently loading?
  className?: string;
}

// Define a combined type for suggestions, including address from details later if needed
// For now, use the basic AutocompleteSuggestion
type LocationSuggestion = AutocompleteSuggestion;

export function UserLocationInput({ getCurrentPosition, isGeoLoading, className }: UserLocationInputProps) {
  const { setUserLocation, flyTo } = useMap();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Loading suggestions or coords
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Debounced Autocomplete Fetch ---
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < AUTOCOMPLETE_MIN_CHARS) { // Only search if query is >= N chars
        setSuggestions([]);
        setIsLoading(false);
        setIsPopoverOpen(false);
        return;
      }
      setIsLoading(true);
      const result = await getPlaceAutocomplete(query);
      if (result.error) {
        toast.error(`Autocomplete error: ${result.error}`, { icon: <Info className="h-4 w-4" /> });
        setSuggestions([]);
      } else {
        setSuggestions(result.data || []);
        // Keep popover open only if there are suggestions and input has focus/value
        setIsPopoverOpen((result.data || []).length > 0 && document.activeElement === inputRef.current);
      }
      setIsLoading(false);
    }, AUTOCOMPLETE_DEBOUNCE_WAIT),
    []
  );

  // --- Input Change Handler ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim().length >= AUTOCOMPLETE_MIN_CHARS) {
        fetchSuggestions(value); // Trigger debounced fetch
        setIsPopoverOpen(true); // Open popover on type if length > N
    } else {
        setSuggestions([]);
        setIsPopoverOpen(false); // Close if input cleared or too short
    }
  };

  // --- Suggestion Selection Handler ---
  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    setIsLoading(true);
    setInputValue(suggestion.description); // Use full description for input feedback
    setSuggestions([]);
    setIsPopoverOpen(false);
    const coordsResult = await getCoordsFromPlaceId(suggestion.place_id);
    if (coordsResult.error) {
      toast.error(`Error getting location details: ${coordsResult.error}`, { icon: <Info className="h-4 w-4" /> });
      setUserLocation(null);
    } else if (coordsResult.data) {
      setUserLocation(coordsResult.data);
      flyTo(coordsResult.data, 14); // Fly to selected location (zoom level 14)
      toast.success(`Location set to: ${suggestion.description}`, { icon: <LocateFixed className="h-4 w-4" /> });
    }
    setIsLoading(false);
    inputRef.current?.blur();
  };

  // --- "My Location" Button Click Handler ---
  const handleMyLocationClick = () => {
    setInputValue(""); // Clear input when using current location
    setSuggestions([]);
    setIsPopoverOpen(false);
    getCurrentPosition(); // Trigger geolocation hook
    inputRef.current?.blur();
  };

  // --- Clear Input Handler ---
  const handleClearInput = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent popover from opening if it was closed
    setInputValue("");
    setSuggestions([]);
    setIsPopoverOpen(false);
    inputRef.current?.focus(); // Keep focus
  };

  // Close popover if input is blurred and no suggestion was clicked
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Use setTimeout to allow click event on popover items to fire first
    setTimeout(() => {
        if (!inputRef.current?.contains(document.activeElement)) { // Check if focus moved outside input/popover area
            setIsPopoverOpen(false);
        }
    }, 100);
   };

  return (
    <div className={cn("flex gap-2 w-full", className)}>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-full flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      ref={inputRef}
                      placeholder={UI_PLACEHOLDERS.LOCATION_SEARCH}
                      value={inputValue}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (suggestions.length > 0 || inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARS) {
                           setIsPopoverOpen(true);
                        }
                      }}
                      className="w-full pl-9 pr-9 h-10 text-base bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                    />
                    {inputValue && !isLoading && (
                        <button
                          type="button"
                          onClick={handleClearInput}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 p-1"
                          aria-label="Clear search"
                        >
                           <X className="h-4 w-4" />
                        </button>
                    )}
                    {isLoading && (
                         <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-hidden mt-1"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                 <Command shouldFilter={false}>
                    <CommandList>
                        {isLoading && suggestions.length === 0 ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                        <> 
                          {suggestions.length === 0 && !isLoading && inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARS && (
                             <CommandEmpty>No locations found</CommandEmpty>
                          )}
                          {suggestions.length > 0 && (
                            <CommandGroup heading={suggestions.length ? "Suggestions" : undefined}>
                              {suggestions.map((suggestion) => (
                                <CommandItem
                                  key={suggestion.place_id}
                                  value={suggestion.description}
                                  onSelect={() => handleSelectSuggestion(suggestion)}
                                  className="flex flex-col items-start py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                >
                                  <div className="flex items-center w-full text-sm">
                                    <MapPin className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                                    <span className="font-medium truncate">{suggestion.description}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </>
                       )}
                    </CommandList>
                 </Command>
            </PopoverContent>
        </Popover>
        <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 flex-shrink-0 bg-secondary/30 border-0 hover:bg-secondary/50"
            onClick={handleMyLocationClick}
            disabled={isGeoLoading}
            title="Use my location"
            aria-label="Use my current location"
        >
            {isGeoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
    </div>
  );
} 