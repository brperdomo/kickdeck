import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { debugEnvVars, googleMapsApiKey, initGoogleMapsApi } from "@/lib/env";

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
  const [useModernApi, setUseModernApi] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const autocompleteWrapperRef = useRef<HTMLDivElement>(null);

  // Debug environment variables when component mounts
  useEffect(() => {
    debugEnvVars();
    // Call the initGoogleMapsApi from env.ts
    initGoogleMapsApi();
  }, []);

  // Update input value when the value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Maps API is loaded");
        setIsGoogleMapsLoaded(true);
        
        // Check if modern PlaceAutocompleteElement is available
        if (window.google.maps.places.PlaceAutocompleteElement) {
          console.log("Modern PlaceAutocompleteElement API is available");
          setUseModernApi(true);
        } else {
          console.log("Using legacy Autocomplete API");
          setUseModernApi(false);
        }
      } else {
        console.log("Google Maps API is not loaded yet");
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

  // Extract address components from place details
  const extractAddressComponents = useCallback((placeResult: any) => {
    if (!placeResult || !placeResult.address_components) {
      return { city: '', state: '', country: '' };
    }
    
    let city = '';
    let state = '';
    let country = '';
    
    placeResult.address_components.forEach((component: any) => {
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
  }, []);

  // Initialize the modern PlaceAutocompleteElement API
  useEffect(() => {
    if (!isGoogleMapsLoaded || !useModernApi || !autocompleteWrapperRef.current) {
      return;
    }

    try {
      console.log("Initializing PlaceAutocompleteElement API");
      
      // Clear any existing content
      if (autocompleteWrapperRef.current) {
        autocompleteWrapperRef.current.innerHTML = '';
      }
      
      // Create the new PlaceAutocompleteElement
      const autocompleteBetaElement = new window.google.maps.places.PlaceAutocompleteElement({
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
        inputPlaceholder: placeholder,
      });
      
      // Set initial value if available
      if (value) {
        autocompleteBetaElement.value = value;
      }
      
      // Add the element to the DOM
      if (autocompleteWrapperRef.current) {
        autocompleteWrapperRef.current.appendChild(autocompleteBetaElement);
        
        // Add event listener for place changes
        autocompleteBetaElement.addEventListener("gmp-placeselect", (event: any) => {
          const place = event.place;
          if (place) {
            const placeResult = {
              formatted_address: place.formattedAddress,
              address_components: place.addressComponents?.addressComponents || [],
              geometry: {
                location: {
                  lat: () => place.location?.lat,
                  lng: () => place.location?.lng
                }
              },
              name: place.formattedAddress,
              place_id: place.id
            };
            
            // Extract address components
            const components = extractAddressComponents(placeResult);
            placeResult.extractedData = {
              ...components,
              location: { lat: place.location?.lat, lng: place.location?.lng }
            };
            
            // Update input value and trigger onChange
            setInputValue(place.formattedAddress);
            onChange(place.formattedAddress, placeResult);
            
            // Call onPlaceSelect if provided
            if (onPlaceSelect) {
              onPlaceSelect(placeResult);
            }
            
            console.log("Place selected (modern API):", placeResult);
          }
        });
      }
      
      console.log("PlaceAutocompleteElement initialized successfully");
    } catch (error) {
      console.error('Error initializing PlaceAutocompleteElement:', error);
      // Fall back to legacy method if modern API fails
      setUseModernApi(false);
    }
  }, [isGoogleMapsLoaded, useModernApi, placeholder, value, onChange, onPlaceSelect, extractAddressComponents]);

  // Initialize traditional Google Maps Autocomplete (fallback method)
  useEffect(() => {
    if (!isGoogleMapsLoaded || useModernApi || !inputRef.current) {
      return;
    }

    try {
      console.log("Initializing Legacy Google Maps Autocomplete");
      
      // Check if the Google Maps Places Autocomplete constructor exists
      if (window.google.maps.places.Autocomplete) {
        // Create a standard autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
        });

        // Store the instance
        autocompleteRef.current = autocomplete;

        // Add event listener for place changes
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place) {
            handlePlaceSelect(place);
          }
        });

        console.log("Legacy Google Maps Autocomplete initialized successfully");
        
        // Clean up on unmount
        return () => {
          if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
        };
      } else {
        console.warn("Google Maps Places Autocomplete is not available");
      }
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error);
    }
  }, [isGoogleMapsLoaded, useModernApi, extractAddressComponents]);

  // Handle manual input changes (for legacy API)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  // When a place is selected (for legacy API)
  const handlePlaceSelect = (place: any) => {
    if (place) {
      console.log("Place selected (legacy API):", place);
      
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
        
        console.log("Location coordinates:", location);
        
        // Extract address components for additional fields
        const components = extractAddressComponents(place);
        place.extractedData = { ...components, location };
      }
      
      // Call the onPlaceSelect callback if provided
      if (onPlaceSelect) {
        onPlaceSelect(place);
      }
    }
  };

  // Render different UI based on which API is being used
  if (useModernApi) {
    return (
      <div className={`relative ${className}`} ref={autocompleteWrapperRef}>
        {/* PlaceAutocompleteElement will be appended here */}
      </div>
    );
  }

  // Fallback to legacy input + autocomplete
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={isGoogleMapsLoaded ? placeholder : `${placeholder} (Google Maps API not loaded)`}
        className={className}
      />
    </div>
  );
}