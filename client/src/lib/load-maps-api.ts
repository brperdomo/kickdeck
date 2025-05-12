import { env } from './env';

let googleMapsPromise: Promise<void> | null = null;

/**
 * Dynamically loads the Google Maps API with the Places library
 * This avoids loading the API on every page, only when needed
 */
export function loadGoogleMapsApi(): Promise<void> {
  // If we already have a loading promise, return it
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  // Check if the API is already loaded
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Create a new loading promise
  googleMapsPromise = new Promise((resolve, reject) => {
    // Create window callback for when the API loads
    const callbackName = '__googleMapsApiOnLoadCallback';
    window[callbackName] = function() {
      resolve();
      delete window[callbackName];
    };

    // Get API key from environment
    const apiKey = env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key is missing. Make sure VITE_GOOGLE_MAPS_API_KEY is set in .env');
      reject(new Error('Google Maps API key is missing'));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=places&key=${apiKey}&v=beta&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
      delete window[callbackName];
    };

    // Add script to document
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

// Add type definition for the window object
declare global {
  interface Window {
    [key: string]: any;
    google?: {
      maps?: any;
    };
  }
}