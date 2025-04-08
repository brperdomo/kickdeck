/**
 * Utility functions for formatting address data with proper null handling
 */

/**
 * Formats a complete address string from address components
 * @param address Street address
 * @param city City
 * @param state State or province
 * @param zipCode Postal/ZIP code
 * @param country Country
 * @returns Formatted address string or an empty string if essential components are missing
 */
export function formatFullAddress(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zipCode?: string | null,
  country?: string | null
): string {
  if (!address && !city && !state && !zipCode && !country) {
    return '';
  }

  const parts = [];
  if (address) parts.push(address);
  
  const cityState = [];
  if (city) cityState.push(city);
  if (state) cityState.push(state);
  if (cityState.length > 0) parts.push(cityState.join(', '));
  
  if (zipCode) parts.push(zipCode);
  if (country) parts.push(country);

  return parts.join(', ');
}

/**
 * Generates a Google Maps URL from address components
 * @param address Street address
 * @param city City
 * @param state State or province
 * @param zipCode Postal/ZIP code
 * @param country Country
 * @returns Google Maps URL or null if essential components are missing
 */
export function getGoogleMapsUrl(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zipCode?: string | null,
  country?: string | null
): string | null {
  const query = formatFullAddress(address, city, state, zipCode, country);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

/**
 * Generates a Google Maps URL directly from coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Google Maps URL with coordinates
 */
export function getGoogleMapsUrlFromCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): string | null {
  if (!hasValidCoordinates(latitude, longitude)) {
    return null;
  }
  
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/**
 * Formats a city, state, country string
 * @param city City
 * @param state State or province
 * @param country Country
 * @returns Formatted city, state, country string or empty string if all are missing
 */
export function formatCityStateCountry(
  city?: string | null,
  state?: string | null,
  country?: string | null
): string {
  if (!city && !state && !country) {
    return '';
  }

  const parts = [];
  
  const cityState = [];
  if (city) cityState.push(city);
  if (state) cityState.push(state);
  if (cityState.length > 0) parts.push(cityState.join(', '));
  
  if (country) parts.push(country);

  return parts.join(', ');
}

/**
 * Checks if coordinates are valid (non-zero and within range)
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if coordinates are valid
 */
export function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  
  // Check for valid ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }
  
  // Check for zero coordinates (often placeholder data)
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  
  return true;
}

/**
 * Formats opening hours for display
 * @param openTime Opening time string (HH:MM format)
 * @param closeTime Closing time string (HH:MM format)
 * @returns Formatted operating hours string or 'Not specified' if missing
 */
export function formatHours(
  openTime?: string | null,
  closeTime?: string | null
): string {
  if (!openTime && !closeTime) {
    return 'Not specified';
  }
  
  if (openTime && !closeTime) {
    return `Opens at ${formatTimeString(openTime)}`;
  }
  
  if (!openTime && closeTime) {
    return `Closes at ${formatTimeString(closeTime)}`;
  }
  
  return `${formatTimeString(openTime as string)} - ${formatTimeString(closeTime as string)}`;
}

/**
 * Helper to format time strings in a more readable format
 * @param timeString Time string in HH:MM format
 * @returns Formatted time string
 */
function formatTimeString(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return timeString;
  }
}

/**
 * Generates a Google Maps directions URL
 * @param address Street address
 * @param city City
 * @param state State or province
 * @param zipCode Postal/ZIP code
 * @param country Country
 * @returns Google Maps directions URL
 */
export function getDirectionsUrl(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zipCode?: string | null,
  country?: string | null
): string | null {
  const destination = formatFullAddress(address, city, state, zipCode, country);
  return destination 
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` 
    : null;
}