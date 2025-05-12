// Environment variable handling for client-side
export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""; // Use environment API key
export const tinymceApiKey = import.meta.env.VITE_TINYMCE_API_KEY || "";
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
export const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";
export const hostUrl = import.meta.env.VITE_HOST || "";

// Log API key length for debugging
console.log(`Google Maps API key length: ${googleMapsApiKey?.length || 0} characters`);

// Initialize Google Maps API
export function initGoogleMapsApi() {
  // Check if the Maps script is already loaded
  if (window.google && window.google.maps) {
    console.log("Google Maps API already loaded");
    return true;
  }

  try {
    // Modify the existing script tag if it exists
    const googleMapsScript = document.getElementById('google-maps-script');
    if (googleMapsScript) {
      console.log("Updating existing Google Maps script tag");
      // Make sure to include the key parameter
      const currentSrc = googleMapsScript.getAttribute('src') || '';
      
      if (!currentSrc.includes(`key=${googleMapsApiKey}`)) {
        // Create a new URL
        const baseUrl = currentSrc.split('?')[0];
        googleMapsScript.setAttribute('src', 
          `${baseUrl}?key=${googleMapsApiKey}&libraries=places,marker&callback=Function.prototype&v=beta`
        );
        console.log("Updated Google Maps script with API key");
      }
      return true;
    } else {
      // Create a new script element if not found
      console.log("Creating new Google Maps script tag");
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,marker&callback=Function.prototype&v=beta`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      return true;
    }
  } catch (error) {
    console.error("Error initializing Google Maps API:", error);
    return false;
  }
}

// Debug function to check if environment variables are loaded
export function debugEnvVars() {
  console.log("Environment variables status:");
  console.log("- Google Maps API Key:", googleMapsApiKey ? `Present (${googleMapsApiKey.length} chars)` : "Missing");
  console.log("- TinyMCE API Key:", tinymceApiKey ? "Present" : "Missing");
  console.log("- Stripe Publishable Key:", stripePublishableKey ? "Present" : "Missing");
  console.log("- Bypass Auth:", bypassAuth);
  console.log("- Host URL:", hostUrl);
}