import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

export function LogoutHandler() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectTimeoutActive, setRedirectTimeoutActive] = useState(false);

  useEffect(() => {
    // Check if we're being rate limited (429 error)
    // This can happen if there's a redirect loop causing multiple logout attempts
    const urlParams = new URLSearchParams(window.location.search);
    const rateLimited = urlParams.get('rate_limited') === 'true';
    
    // If we detect rate limiting, skip the API call and just clear client state
    if (rateLimited) {
      console.log("Rate limit detected, skipping API call and proceeding with client-side logout");
      // Set the flag to prevent multiple redirects
      setRedirectTimeoutActive(true);
      // Store the logout message directly
      sessionStorage.setItem('logout_message', 'You have been logged out (rate limit detected)');
      // Redirect to auth page without the rate_limited param to prevent loops
      window.location.href = '/auth';
      return;
    }
    
    // Enhanced direct logout with multi-tab/browser support
    const doLogout = async () => {
      try {
        // Add a rate-limiting prevention gate
        if (sessionStorage.getItem('logout_in_progress')) {
          console.log("Logout already in progress, preventing duplicate");
          setRedirectTimeoutActive(true);
          window.location.href = '/auth?logged_out=true';
          return;
        }
        sessionStorage.setItem('logout_in_progress', 'true');
        
        // 0. Broadcast logout event to all tabs
        try {
          // Create a broadcast channel for cross-tab communication
          const broadcastChannel = new BroadcastChannel('app-logout');
          // Send a logout message to all tabs
          broadcastChannel.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
          // Close the channel after sending
          broadcastChannel.close();
          console.log("Broadcast logout event to all tabs");
        } catch (err) {
          console.warn('BroadcastChannel not supported or failed', err);
        }

        // 1. Call the API if possible - with additional anti-caching
        try {
          console.log("Initiating logout API call");
          const timestamp = Date.now(); // Add timestamp to prevent caching
          const response = await fetch(`/api/logout?_t=${timestamp}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Timestamp': timestamp.toString()
            }
          });
          
          // Check for rate limiting - if detected, redirect to a special URL
          if (response.status === 429) {
            console.error("Rate limit detected during logout API call");
            // Handle rate limiting specially
            setRedirectTimeoutActive(true);
            sessionStorage.setItem('logout_message', 'You have been logged out (rate limit detected)');
            window.location.href = '/auth?rate_limited=true';
            return;
          }
          
          console.log("Logout API call completed with status:", response.status);
        } catch (e) {
          console.error("API call failed, continuing with client-side logout:", e);
        }

        // 2. Clear client state regardless of API success/failure
        queryClient.clear();
        queryClient.resetQueries();
        
        // 3. Clear all storage
        try {
          localStorage.clear();
          sessionStorage.clear();
          
          // Store the logout message in session storage so it persists through page reload
          // We do this AFTER clearing to ensure it gets set
          sessionStorage.setItem('logout_message', 'You have been successfully logged out');
        } catch (e) {
          console.error("Storage clear error:", e);
        }
        
        // 4. Clear all cookies systematically
        try {
          document.cookie.split(';').forEach(c => {
            // More robust cookie clearing
            const cookie = c.trim();
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
            if (name) { // Only process non-empty cookie names
              document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
              // Also try with all variations of the path to ensure complete removal
              document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/;domain=${window.location.hostname}`;
              document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/;domain=.${window.location.hostname}`;
            }
          });
          console.log("All cookies cleared");
        } catch (e) {
          console.error("Cookie clear error:", e);
        }
        
        // 5. Set cache control headers to prevent browser caching
        try {
          const meta = document.createElement('meta');
          meta.httpEquiv = 'Cache-Control';
          meta.content = 'no-store, no-cache, must-revalidate, max-age=0';
          document.head.appendChild(meta);
          
          const pragmaMeta = document.createElement('meta');
          pragmaMeta.httpEquiv = 'Pragma';
          pragmaMeta.content = 'no-cache';
          document.head.appendChild(pragmaMeta);
          
          const expiresMeta = document.createElement('meta');
          expiresMeta.httpEquiv = 'Expires';
          expiresMeta.content = '0';
          document.head.appendChild(expiresMeta);
        } catch (e) {
          console.error("Meta tag error:", e);
        }

        // 6. Finally, redirect with guard to prevent multiple redirects
        if (!redirectTimeoutActive) {
          setRedirectTimeoutActive(true);
          // Short timeout to ensure UI has time to update
          setTimeout(() => {
            console.log("Redirecting to auth page with logged_out parameter");
            // Use wouter's setLocation for client-side navigation
            setLocation('/auth?logged_out=true');
          }, 200);
        }
      } catch (error) {
        console.error("Critical error during logout:", error);
        setErrorMessage("Error during logout. Redirecting...");
        
        // Fallback redirect with the most essential operations
        if (!redirectTimeoutActive) {
          setRedirectTimeoutActive(true);
          try {
            // Last attempt to clear minimal essential state
            sessionStorage.setItem('logout_message', 'You have been successfully logged out');
            document.cookie = "connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
          } catch (e) {
            console.error("Final cleanup failed:", e);
          }
          setLocation('/auth?logged_out=true');
        }
      }
    };
    
    // Execute logout immediately
    doLogout();
    
    // Prevent any issues by having a fallback timeout
    const fallbackTimer = setTimeout(() => {
      if (!redirectTimeoutActive) {
        console.log("Fallback logout redirect triggered");
        setRedirectTimeoutActive(true);
        try {
          sessionStorage.setItem('logout_message', 'You have been successfully logged out');
        } catch (e) {
          // Ignore errors here
        }
        setLocation('/auth?logged_out=true');
      }
    }, 3000);
    
    // Clean up the fallback timer
    return () => clearTimeout(fallbackTimer);
  }, [queryClient, setLocation]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        {errorMessage ? (
          <p className="text-destructive text-lg font-medium">{errorMessage}</p>
        ) : (
          <p className="text-lg font-medium">Securely logging you out...</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">Clearing session data...</p>
      </div>
    </div>
  );
}