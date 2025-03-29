import { useRef, useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { useLoadScript } from '@react-google-maps/api';

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
}

const libraries = ["places"] as ["places"];

export function GoogleMapsAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  className = "",
  onPlaceSelect,
}: GoogleMapsAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [inputValue, setInputValue] = useState(value);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize autocomplete when the script is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const options = {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    };

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    autocompleteRef.current.addListener('place_changed', () => {
      if (!autocompleteRef.current) return;

      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) {
        // User entered the name of a Place that was not suggested
        onChange(inputValue);
        return;
      }

      // Get address components
      let formattedAddress = place.formatted_address || "";
      onChange(formattedAddress, place);
      setInputValue(formattedAddress);
      
      if (onPlaceSelect && place) {
        onPlaceSelect(place);
      }
    });

    return () => {
      if (autocompleteRef.current && window.google) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange, onPlaceSelect]);

  if (loadError) {
    return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={className} />;
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={className}
      disabled={!isLoaded}
    />
  );
}