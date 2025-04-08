/**
 * Utility functions for formatting and handling address and location data
 */

/**
 * Interface for address components
 */
interface AddressComponents {
  address: string;
  city: string;
  state: string;
  country: string;
}

/**
 * Interface for coordinate components
 */
interface CoordinateComponents {
  latitude: string;
  longitude: string;
}

/**
 * Formats address components into an array of lines for display
 * @param components Address components
 * @returns Array of formatted address lines
 */
export function formatAddress(components: AddressComponents): string[] {
  const { address, city, state, country } = components;
  const lines: string[] = [];
  
  // Add street address
  if (address) {
    lines.push(address);
  }
  
  // Format city, state, and country
  let cityState = '';
  if (city) {
    cityState += city;
  }
  
  if (state) {
    cityState += cityState ? `, ${state}` : state;
  }
  
  if (cityState) {
    lines.push(cityState);
  }
  
  // Add country on a separate line if provided
  if (country) {
    lines.push(country);
  }
  
  return lines;
}

/**
 * Formats time range for display
 * @param openTime Opening time
 * @param closeTime Closing time
 * @returns Formatted time range
 */
export function formatTimeRange(openTime: string, closeTime: string): string {
  if (!openTime || !closeTime) {
    return 'N/A';
  }
  
  try {
    // Format times for display
    const formatTime = (timeStr: string) => {
      // Parse the time string (expected format: "HH:MM")
      const [hours, minutes] = timeStr.split(':').map(Number);
      const isPM = hours >= 12;
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''} ${isPM ? 'PM' : 'AM'}`;
    };
    
    return `${formatTime(openTime)} - ${formatTime(closeTime)}`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return `${openTime} - ${closeTime}`;
  }
}

/**
 * Generates a Google Maps URL from coordinates
 * @param components Coordinate components
 * @returns Google Maps URL
 */
export function getGoogleMapsUrl(components: CoordinateComponents): string {
  const { latitude, longitude } = components;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/**
 * Generates a directions URL to a location
 * @param components Coordinate components
 * @returns Google Maps directions URL
 */
export function getDirectionsUrl(components: CoordinateComponents): string {
  const { latitude, longitude } = components;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}