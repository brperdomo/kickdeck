import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * A component that logs information about the current route
 * Helps debug routing issues with Wouter
 */
export function RouteDebugger() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Use these to troubleshoot routing issues
    console.log('Current route location (Wouter):', location);
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('Current search:', window.location.search);
    
    // This is specific to our issue
    if (location === '/auth') {
      if (window.location.search.includes('logged_out=true')) {
        console.log('DEBUGGING: Route /auth with logged_out=true parameter detected');
      }
    }
  }, [location]);
  
  // This component doesn't render anything
  return null;
}