/**
 * Custom hook for loading Google Maps JavaScript API
 */

import { useState, useEffect } from 'react';

// Add Google type to window object
interface CustomWindow extends Window {
  google?: any;
  initGoogleMapsCallback?: () => void;
}

declare const window: CustomWindow;

/**
 * API key management for Google Maps integration
 * Note: In production, this should be loaded from environment variables
 */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Hook for dynamically loading the Google Maps JavaScript API
 * @param libraries Array of Google Maps libraries to load (e.g., 'places', 'geometry')
 * @returns Object containing loading status and error if any occurred
 */
export function useGoogleMapsScript(libraries: string[] = []): {
  isLoaded: boolean;
  loadError: Error | null;
} {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if Google Maps API is already loaded
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    // Generate a unique callback name
    const callbackName = `initGoogleMapsCallback_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create a promise that resolves when the Google Maps API is loaded
    window.initGoogleMapsCallback = () => {
      setIsLoaded(true);
    };

    // Create the script element
    const script = document.createElement('script');
    
    // Construct the URL with API key and libraries
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}${librariesParam}&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;
    
    // Handle script loading errors
    script.onerror = (error) => {
      setLoadError(new Error('Failed to load Google Maps API script'));
      document.body.removeChild(script);
    };
    
    // Append the script to the document
    document.body.appendChild(script);
    
    // Cleanup
    return () => {
      window.initGoogleMapsCallback = undefined;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [libraries.join(',')]);  // Only reload if the libraries change
  
  return { isLoaded, loadError };
}