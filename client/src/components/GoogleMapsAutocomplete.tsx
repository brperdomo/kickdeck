import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { googleMapsApiKey, initGoogleMapsApi } from "@/lib/env";

// Extend the window interface to include the google object
declare global {
  interface Window {
    google: any;
  }
}

// Define the types we need from Google Maps API
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceGeometry {
  location: {
    lat: () => number;
    lng: () => number;
  };
}

interface PlaceResult {
  address_components?: AddressComponent[];
  formatted_address?: string;
  geometry?: PlaceGeometry;
  name?: string;
  place_id?: string;
}

// Our extended place result with extracted data
interface ExtendedPlaceResult extends PlaceResult {
  extractedData?: {
    city: string;
    state: string;
    country: string;
    location?: {
      lat: number;
      lng: number;
    }
  }
}

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A simple implementation using the Google Maps Autocomplete API
 * This is a reliable approach to provide address search and selection
 */
export function GoogleMapsAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  className = "",
}: GoogleMapsAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  // Initialize Google Maps API when component mounts
  useEffect(() => {
    // Call the initGoogleMapsApi from env.ts
    initGoogleMapsApi();
    
    // Check if Google Maps API is loaded
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Maps API is loaded");
        setIsGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };
    
    // If Google Maps is already loaded, set state immediately
    if (checkGoogleMapsLoaded()) {
      return;
    }
    
    // Otherwise, set up an interval to check periodically
    const interval = setInterval(() => {
      if (checkGoogleMapsLoaded()) {
        clearInterval(interval);
      }
    }, 500);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  // Update input value when the prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize Google Maps Autocomplete once API is loaded and we have inputRef
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current) {
      return;
    }

    try {
      console.log("Initializing Google Maps Autocomplete");
      
      // Create a standard autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
      });

      // Store the instance
      autocompleteRef.current = autocomplete;

      // Add event listener for place changes
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace() as PlaceResult;
        if (!place || !place.geometry) {
          console.log("No place details available");
          return;
        }
        
        // Get the formatted address
        const formattedAddress = place.formatted_address || '';
        setInputValue(formattedAddress);
        
        // Extract location data
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        // Extract address components
        const components = extractAddressComponents(place);
        
        // Create place object with extracted data
        const placeWithExtractedData: ExtendedPlaceResult = {
          ...place,
          extractedData: {
            ...components,
            location
          }
        };
        
        // Call the onChange callback with the selected place
        onChange(formattedAddress, placeWithExtractedData);
        
        console.log("Selected place:", place);
        console.log("Extracted components:", components);
      });

      console.log("Google Maps Autocomplete initialized successfully");
      
      // Clean up on unmount
      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error);
    }
  }, [isGoogleMapsLoaded, onChange]);

  // Extract address components from place details
  function extractAddressComponents(place: PlaceResult) {
    if (!place || !place.address_components) {
      return { city: '', state: '', country: '' };
    }
    
    let city = '';
    let state = '';
    let country = '';
    
    place.address_components.forEach((component: AddressComponent) => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
    });
    
    return { city, state, country };
  }

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={isGoogleMapsLoaded ? placeholder : `${placeholder} (Loading Google Maps...)`}
        className={className}
        autoComplete="off"
      />
    </div>
  );
}