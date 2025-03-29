import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { debugEnvVars, googleMapsApiKey } from "@/lib/env";

// Extend the window interface to include the google object
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  onPlaceSelect?: (place: any) => void;
}

export function GoogleMapsAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  className = "",
  onPlaceSelect,
}: GoogleMapsAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement | null>(null);
  const placeAutocompleteRef = useRef<any>(null);

  // Debug environment variables when component mounts
  useEffect(() => {
    debugEnvVars();
  }, []);

  // Update input value when the value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
      } else {
        setIsGoogleMapsLoaded(false);
      }
    };
    
    // Initial check
    checkGoogleMapsLoaded();
    
    // Set up an interval to periodically check if Google Maps has loaded
    const interval = setInterval(checkGoogleMapsLoaded, 500);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  // Initialize PlaceAutocompleteElement
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current || !autocompleteContainerRef.current) {
      return;
    }

    try {
      // Create the PlaceAutocompleteElement
      const { PlaceAutocompleteElement } = window.google.maps.places;
      
      // Create the PlaceAutocompleteElement and configure it
      const placeAutocomplete = new PlaceAutocompleteElement({
        inputElement: inputRef.current,
        types: ['address'], // Restrict to addresses only
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
      });

      // Store the instance
      placeAutocompleteRef.current = placeAutocomplete;

      // Add event listener for place changes
      placeAutocomplete.addListener('place_changed', () => {
        const place = placeAutocomplete.getPlace();
        if (place) {
          handlePlaceSelect(place);
        }
      });

      // Clean up on unmount
      return () => {
        if (placeAutocompleteRef.current) {
          // Cleanup if needed
        }
      };
    } catch (error) {
      console.error('Error initializing PlaceAutocompleteElement:', error);
    }
  }, [isGoogleMapsLoaded, inputRef.current, autocompleteContainerRef.current]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  // When a place is selected
  const handlePlaceSelect = (place: any) => {
    if (place) {
      // Get formatted address
      const formattedAddress = place.formatted_address || place.name || '';
      setInputValue(formattedAddress);
      onChange(formattedAddress, place);
      
      // Extract and set location data if available
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        // Extract address components for additional fields
        if (place.address_components) {
          let city = '';
          let state = '';
          let country = '';
          
          place.address_components.forEach((component: any) => {
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
          
          // Save this data to pass along with the place
          place.extractedData = { city, state, country, location };
        }
      }
      
      // Call the onPlaceSelect callback if provided
      if (onPlaceSelect) {
        onPlaceSelect(place);
      }
    }
  };

  // Just return a basic input if Google Maps is not loaded
  if (!isGoogleMapsLoaded || !googleMapsApiKey) {
    return (
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={`${placeholder} (Google Maps API not loaded)`}
          className={className}
        />
      </div>
    );
  }

  return (
    <div className="relative" ref={autocompleteContainerRef}>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}