// Environment variable handling for client-side
export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
export const tinymceApiKey = import.meta.env.VITE_TINYMCE_API_KEY || "";
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
export const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";
export const hostUrl = import.meta.env.VITE_HOST || "";

// Initialize Google Maps API
export function initGoogleMapsApi() {
  if (!googleMapsApiKey) {
    console.error("Google Maps API key is missing");
    return false;
  }

  const googleMapsScript = document.getElementById('google-maps-script');
  if (googleMapsScript) {
    googleMapsScript.setAttribute(
      'src',
      `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=Function.prototype`
    );
    return true;
  } else {
    console.error("Google Maps script tag not found");
    return false;
  }
}

// Debug function to check if environment variables are loaded
export function debugEnvVars() {
  console.log("Environment variables status:");
  console.log("- Google Maps API Key:", googleMapsApiKey ? "Present" : "Missing");
  console.log("- TinyMCE API Key:", tinymceApiKey ? "Present" : "Missing");
  console.log("- Stripe Publishable Key:", stripePublishableKey ? "Present" : "Missing");
  console.log("- Bypass Auth:", bypassAuth);
  console.log("- Host URL:", hostUrl);
}