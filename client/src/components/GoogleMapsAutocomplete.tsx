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
 * A modern implementation using the Google Maps PlaceAutocompleteElement API
 * This approach follows Google's latest recommendations as of March 2025
 * 
 * The component will use the newer PlaceAutocompleteElement API when available,
 * and fall back to the legacy Autocomplete API if needed, with appropriate
 * warning management for the March 2025 deprecation.
 */
export function GoogleMapsAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  className = "",
}: GoogleMapsAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [useModernAPI, setUseModernAPI] = useState(true);
  const autocompleteContainerRef = useRef<HTMLDivElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const placeDataRef = useRef<any>(null);
  const warningDisplayedRef = useRef(false);

  // Initialize Google Maps API when component mounts
  useEffect(() => {
    // Call the initGoogleMapsApi from env.ts
    initGoogleMapsApi();
    
    // Check if Google Maps API is loaded
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Maps API is loaded");
        setIsGoogleMapsLoaded(true);
        
        // Determine which API to use based on what's available
        // Check if we can use the modern PlaceAutocompleteElement
        if (window.google.maps.places.PlaceAutocompleteElement) {
          setUseModernAPI(true);
        } else {
          // Fall back to legacy API
          setUseModernAPI(false);
          
          // Check if we've already logged deprecation warning
          if (!warningDisplayedRef.current) {
            console.warn(
              "Using legacy Google Maps Places Autocomplete API. As of March 1st, 2025, " +
              "this API is deprecated. Please update to the newer PlaceAutocompleteElement API."
            );
            warningDisplayedRef.current = true;
          }
        }
        
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

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (!isGoogleMapsLoaded || !autocompleteContainerRef.current) {
      return;
    }

    try {
      // Clean any existing content
      if (autocompleteContainerRef.current.firstChild) {
        autocompleteContainerRef.current.innerHTML = '';
      }
      
      // Choose implementation based on API availability
      if (useModernAPI) {
        console.log("Initializing Google Maps using modern PlaceAutocompleteElement API");
        initializeModernAutocomplete();
      } else {
        console.log("Falling back to legacy Autocomplete API");
        initializeLegacyAutocomplete();
      }
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error);
      
      // If modern API fails, fallback to legacy
      if (useModernAPI) {
        console.log("Modern API failed, attempting to fall back to legacy implementation");
        setUseModernAPI(false);
      }
    }
    
    // Clean up on unmount or re-initialization
    return () => {
      if (autocompleteRef.current) {
        if (useModernAPI) {
          autocompleteRef.current.remove();
        } else {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      }
    };
  }, [isGoogleMapsLoaded, useModernAPI, onChange, placeholder, className, inputValue]);
  
  // Initialize the modern PlaceAutocompleteElement API
  const initializeModernAutocomplete = () => {
    if (!autocompleteContainerRef.current) return;
    
    // Modern approach using PlaceAutocompleteElement
    const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
    });
    
    // Apply custom styling to match our UI
    autocompleteElement.style.width = '100%';
    
    // Set the initial value
    if (inputValue) {
      autocompleteElement.value = inputValue;
    }
    
    // Add the element to our container
    autocompleteContainerRef.current.appendChild(autocompleteElement);
    
    // Store for cleanup
    autocompleteRef.current = autocompleteElement;
    
    // Listen to place selection
    autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
      const place = event.detail.place;
      if (place) {
        handlePlaceSelection(place);
      }
    });
    
    // Listen to input changes
    autocompleteElement.addEventListener('input', (e: any) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
    });

    console.log("Modern Google Maps Autocomplete initialized successfully");
  };
  
  // Initialize the legacy Autocomplete API
  const initializeLegacyAutocomplete = () => {
    if (!autocompleteContainerRef.current) return;
    
    // Create a standard input for the legacy approach
    const input = document.createElement('input');
    input.className = `${className} w-full h-10 px-3 py-2 border border-input bg-background rounded-md`;
    input.placeholder = placeholder;
    input.value = inputValue;
    
    autocompleteContainerRef.current.appendChild(input);
    
    // Create a standard autocomplete instance
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
    });

    // Store the instance
    autocompleteRef.current = autocomplete;

    // Add event listener for place changes
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace() as PlaceResult;
      handlePlaceSelection(place);
    });
    
    // Add input change event
    input.addEventListener('input', (e: any) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
    });
    
    console.log("Legacy Google Maps Autocomplete initialized successfully");
  };
  
  // Handle place selection common logic (works for both API versions)
  const handlePlaceSelection = (place: PlaceResult) => {
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
    
    // Store the place data for reference
    placeDataRef.current = placeWithExtractedData;
    
    // Call the onChange callback with the selected place
    onChange(formattedAddress, placeWithExtractedData);
  };

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

  // If not loaded yet, show a regular input as placeholder
  if (!isGoogleMapsLoaded) {
    return (
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={`${placeholder} (Loading Google Maps...)`}
          className={className}
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={autocompleteContainerRef} 
        className="place-autocomplete-container w-full"
      />
    </div>
  );
}