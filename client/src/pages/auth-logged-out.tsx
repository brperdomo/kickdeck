import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// This is a redirect component to handle the special case of auth?logged_out=true
export default function AuthLoggedOut() {
  const [location, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(true);
  
  useEffect(() => {
    console.log('Auth-logged-out page loaded, checking for rate limiting');
    
    // Check if there's been too many redirects in a short time period
    // This helps prevent infinite loops and rate limiting
    const now = Date.now();
    const lastRedirectTime = parseInt(sessionStorage.getItem('last_redirect_time') || '0');
    const redirectCount = parseInt(sessionStorage.getItem('redirect_count') || '0');
    
    // If we've had more than 3 redirects in the last 2 seconds, we might be in a loop
    const possibleLoop = redirectCount > 3 && (now - lastRedirectTime < 2000);
    
    // Update redirect tracking
    sessionStorage.setItem('last_redirect_time', now.toString());
    sessionStorage.setItem('redirect_count', (redirectCount + 1).toString());
    
    // If rate limited or possible loop, just go straight to auth without params
    const urlParams = new URLSearchParams(window.location.search);
    const rateLimited = urlParams.get('rate_limited') === 'true';
    
    if (rateLimited || possibleLoop) {
      console.log('Detected rate limiting or redirect loop, clearing session and going to auth page');
      
      // Clear session to ensure clean state
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Store a logout message right after clearing
        sessionStorage.setItem('logout_message', 
          rateLimited 
            ? 'You have been logged out (rate limit detected)' 
            : 'You have been logged out (redirect loop detected)'
        );
        
        // Set cookie clearing
        document.cookie.split(';').forEach(c => {
          const cookie = c.trim();
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
          if (name) {
            document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
          }
        });
        
        // Delay to ensure UI updates
        setTimeout(() => {
          // Direct to auth without any parameters to break any loop
          window.location.href = '/auth';
        }, 300);
        
        return;
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    }
    
    // Normal case - handle regular logout redirect
    console.log('Setting logout message and redirecting to auth page');
    sessionStorage.setItem('logout_message', 'You have been successfully logged out');
    
    // Redirect to the main auth page WITHOUT the logged_out parameter to prevent loops
    setIsRedirecting(true);
    
    // Small delay to ensure UI has time to update
    setTimeout(() => {
      setLocation('/auth');
    }, 200);
    
  }, [setLocation, location]);
  
  // Simple loading state while redirect happens
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: '#0f0f1a' }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-white text-lg font-medium">Securely logging you out...</p>
        <p className="text-sm text-gray-400 mt-2">Redirecting to login page...</p>
      </div>
    </div>
  );
}