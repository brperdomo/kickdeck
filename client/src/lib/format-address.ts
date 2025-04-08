import { Complex } from '@/types';

/**
 * Formats a complex address into a single string, handling null/undefined values
 * @param complex - The complex object
 * @returns Formatted address string
 */
export function formatAddress(complex: Complex): string {
  const parts = [
    complex.address,
    complex.city,
    complex.state,
    complex.zipCode,
    complex.country
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Formats the opening hours of a complex, handling null/undefined values
 * @param complex - The complex object
 * @returns Formatted opening hours string
 */
export function formatHours(complex: Complex): string {
  if (!complex.openTime && !complex.closeTime) {
    return 'Hours not specified';
  }

  if (complex.openTime && complex.closeTime) {
    return `Open: ${formatTime(complex.openTime)} - ${formatTime(complex.closeTime)}`;
  }

  if (complex.openTime) {
    return `Opens at ${formatTime(complex.openTime)}`;
  }

  return `Closes at ${formatTime(complex.closeTime)}`;
}

/**
 * Formats a time string for display
 * @param timeString - Time string in format 'HH:MM:SS' or 'HH:MM'
 * @returns Formatted time string
 */
function formatTime(timeString: string | null): string {
  if (!timeString) return '';

  // If time is in format 'HH:MM:SS', convert to 'HH:MM'
  const timeParts = timeString.split(':');
  if (timeParts.length >= 2) {
    // Convert 24-hour format to 12-hour format with AM/PM
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutes} ${ampm}`;
  }
  
  return timeString;
}

/**
 * Generates a Google Maps URL for the complex
 * @param complex - The complex object 
 * @returns Google Maps URL for the complex location
 */
export function getGoogleMapsUrl(complex: Complex): string {
  if (!hasValidCoordinates(complex)) {
    // Fallback to address if coordinates not available
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(complex))}`;
  }
  
  return `https://www.google.com/maps/search/?api=1&query=${complex.latitude},${complex.longitude}`;
}

/**
 * Generates a Google Maps directions URL for the complex
 * @param complex - The complex object
 * @returns Google Maps directions URL
 */
export function getDirectionsUrl(complex: Complex): string {
  if (!hasValidCoordinates(complex)) {
    // Fallback to address if coordinates not available
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(complex))}`;
  }
  
  return `https://www.google.com/maps/dir/?api=1&destination=${complex.latitude},${complex.longitude}`;
}

/**
 * Checks if the complex has valid coordinates
 * @param complex - The complex object
 * @returns Whether the complex has valid coordinates
 */
export function hasValidCoordinates(complex: Complex): boolean {
  return typeof complex.latitude === 'number' && 
         typeof complex.longitude === 'number' && 
         !isNaN(complex.latitude) && 
         !isNaN(complex.longitude);
}