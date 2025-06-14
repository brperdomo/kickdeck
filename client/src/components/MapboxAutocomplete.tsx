import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { mapboxApiKey } from "@/lib/env";

// Mapbox feature response types
interface MapboxCoordinates {
  longitude: number;
  latitude: number;
}

interface MapboxContext {
  id: string;
  text: string;
  short_code?: string;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_name: string;
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    maki?: string;
    landmark?: boolean;
    wikidata?: string;
  };
  text: string;
  place_type: string[];
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: MapboxContext[];
}

interface MapboxGeocodingResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

// Extended feature with extracted location data
interface ExtendedMapboxFeature extends MapboxFeature {
  extractedData?: {
    city: string;
    state: string;
    country: string;
    location: {
      lat: number;
      lng: number;
    };
    placeId: string;
  };
}

interface MapboxAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: ExtendedMapboxFeature) => void;
  placeholder?: string;
  className?: string;
  types?: string[]; // Filter by place types: 'address', 'poi', 'place', etc.
  country?: string[]; // Limit to specific countries: ['us', 'ca']
  proximity?: [number, number]; // [longitude, latitude] for proximity bias
  bbox?: [number, number, number, number]; // Bounding box [minLng, minLat, maxLng, maxLat]
}

/**
 * Mapbox-powered address autocomplete component
 * Replaces Google Maps Places API with Mapbox Search Box API
 * 
 * Features:
 * - Real-time address suggestions
 * - Geocoding with coordinates
 * - Address component extraction
 * - Customizable search parameters
 * - Support for proximity bias and bounding boxes
 */
export function MapboxAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  className = "",
  types = ['address', 'poi'],
  country = ['us', 'ca'],
  proximity,
  bbox,
}: MapboxAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<ExtendedMapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Extract address components from Mapbox context
  function extractAddressComponents(feature: MapboxFeature): ExtendedMapboxFeature['extractedData'] {
    let city = '';
    let state = '';
    let country = '';

    // Extract from context array
    if (feature.context) {
      feature.context.forEach((context) => {
        if (context.id.includes('place')) {
          city = context.text;
        } else if (context.id.includes('region')) {
          state = context.short_code || context.text;
        } else if (context.id.includes('country')) {
          country = context.text;
        }
      });
    }

    // If no city found in context, try to extract from place_name
    if (!city && feature.place_type.includes('address')) {
      const parts = feature.place_name.split(', ');
      if (parts.length >= 2) {
        city = parts[1];
      }
    }

    return {
      city,
      state,
      country,
      location: {
        lat: feature.center[1],
        lng: feature.center[0],
      },
      placeId: feature.id,
    };
  }

  // Debounced search function
  const searchAddresses = async (query: string) => {
    if (!query.trim() || !mapboxApiKey) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Build search parameters
      const params = new URLSearchParams({
        access_token: mapboxApiKey,
        limit: '5',
        autocomplete: 'true',
      });

      // Add optional parameters
      if (types.length > 0) {
        params.append('types', types.join(','));
      }
      if (country.length > 0) {
        params.append('country', country.join(','));
      }
      if (proximity) {
        params.append('proximity', `${proximity[0]},${proximity[1]}`);
      }
      if (bbox) {
        params.append('bbox', bbox.join(','));
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      
      // Process features and add extracted data
      const processedFeatures: ExtendedMapboxFeature[] = data.features.map((feature) => ({
        ...feature,
        extractedData: extractAddressComponents(feature),
      }));

      setSuggestions(processedFeatures);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);

    // Immediately call onChange for controlled input
    onChange(newValue);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (feature: ExtendedMapboxFeature) => {
    setInputValue(feature.place_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onChange(feature.place_name, feature);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mapboxApiKey) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${placeholder} (Mapbox API key required)`}
        className={className}
        autoComplete="off"
      />
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              ref={(el) => (suggestionRefs.current[index] = el)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="font-medium text-sm text-gray-900">
                {suggestion.text}
              </div>
              <div className="text-xs text-gray-500">
                {suggestion.place_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}