import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function LogoutHandler() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectTimeoutActive, setRedirectTimeoutActive] = useState(false);

  useEffect(() => {
    // Enhanced direct logout with multi-tab/browser support
    const doLogout = async () => {
      try {
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
          await fetch(`/api/logout?_t=${timestamp}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Timestamp': timestamp.toString()
            }
          });
          console.log("Logout API call completed");
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
            console.log("Redirecting to auth-logged-out page");
            // Our special intermediary page that handles clean logout redirects
            window.location.href = '/auth-logged-out';
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
          window.location.href = '/auth-logged-out';
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
        window.location.href = '/auth-logged-out';
      }
    }, 3000);
    
    // Clean up the fallback timer
    return () => clearTimeout(fallbackTimer);
  }, [queryClient]);
  
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