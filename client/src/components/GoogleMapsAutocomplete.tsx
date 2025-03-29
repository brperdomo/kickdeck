import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { debugEnvVars } from "@/lib/env";

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
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement | null>(null);
  const placeAutocompleteRef = useRef<any>(null);

  // Debug environment variables when component mounts
  useEffect(() => {
    debugEnvVars();
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  // Simple manual address input if Google Maps fails to load
  if (!isLoaded) {
    return (
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
    />
  );
}