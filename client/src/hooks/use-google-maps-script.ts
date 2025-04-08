import { useState, useEffect } from 'react';

// Extend window with Google Maps API
declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Options for loading the Google Maps JavaScript API
 */
interface UseGoogleMapsScriptOptions {
  apiKey?: string;
  libraries?: string[];
  version?: string;
  language?: string;
  region?: string;
}

/**
 * Result of the useGoogleMapsScript hook
 */
interface UseGoogleMapsScriptResult {
  loaded: boolean;
  error: Error | null;
}

/**
 * A hook to dynamically load the Google Maps JavaScript API
 */
export function useGoogleMapsScript(options: UseGoogleMapsScriptOptions = {}): UseGoogleMapsScriptResult {
  const [loaded, setLoaded] = useState(!!window.google?.maps);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the API is already loaded, don't reload it
    if (window.google?.maps) {
      setLoaded(true);
      return;
    }

    // Create a unique callback name to avoid conflicts
    const callbackName = `googleMapsCallback_${Math.round(Math.random() * 1000000)}`;
    window[callbackName] = () => {
      setLoaded(true);
      delete window[callbackName];
    };

    // Create the script element
    const script = document.createElement('script');
    script.src = createScriptUrl({
      ...options,
      callback: callbackName
    });
    script.async = true;
    script.defer = true;

    // Handle errors
    script.onerror = (error) => {
      setError(new Error(`Failed to load Google Maps API: ${error.toString()}`));
      document.head.removeChild(script);
    };

    // Append the script to the document
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window[callbackName];
    };
  }, [options.apiKey, options.libraries?.toString(), options.version, options.language, options.region]);

  return { loaded, error };
}

/**
 * Helper function to create the Google Maps script URL
 */
function createScriptUrl(
  { apiKey, libraries = [], version = 'weekly', language, region, callback }: UseGoogleMapsScriptOptions & { callback?: string }
): string {
  const params = new URLSearchParams({
    v: version,
    ...(apiKey && { key: apiKey }),
    ...(libraries.length > 0 && { libraries: libraries.join(',') }),
    ...(language && { language }),
    ...(region && { region }),
    ...(callback && { callback })
  });

  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}