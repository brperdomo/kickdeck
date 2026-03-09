/**
 * Helper functions to handle domain detection
 */

/**
 * Checks if the current domain is the main KickDeck.xyz domain
 * This is used to determine whether to show the marketing site or the app
 */
export function isMainDomain(): boolean {
  // In development, we'll use a query parameter to simulate main domain
  if (typeof window !== 'undefined') {
    // Check for development mode with simulation parameter
    if (window.location.search.includes('showLanding=true')) {
      return true;
    }

    // Check actual domain in production
    const hostname = window.location.hostname;

    // Check if it's the main domain (not a subdomain)
    // localhost is NEVER the main domain — use ?showLanding=true to test the landing page
    return (
      hostname === 'kickdeck.xyz' ||
      hostname === 'www.kickdeck.xyz'
    );
  }
  
  return false;
}

/**
 * Checks if the current domain is a client subdomain
 */
export function isClientSubdomain(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check for a subdomain pattern
    const parts = hostname.split('.');
    const isSubdomain = parts.length > 2;
    
    // Specific subdomains that are not client organizations
    const nonClientSubdomains = ['app', 'www', 'api'];
    
    if (isSubdomain) {
      const subdomain = parts[0];
      return !nonClientSubdomains.includes(subdomain);
    }
  }
  
  return false;
}