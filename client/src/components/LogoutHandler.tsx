import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function LogoutHandler() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectTimeoutActive, setRedirectTimeoutActive] = useState(false);

  useEffect(() => {
    // Simple direct logout with maximum reliability
    const doLogout = async () => {
      try {
        // 1. Call the API if possible
        try {
          console.log("Initiating logout API call");
          await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          console.log("Logout API call completed");
        } catch (e) {
          console.error("API call failed, continuing with client-side logout:", e);
        }

        // 2. Clear client state regardless of API success/failure
        queryClient.clear();
        queryClient.resetQueries();
        
        // 3. Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // 4. Clear cookies
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });

        // 5. Finally, redirect
        if (!redirectTimeoutActive) {
          setRedirectTimeoutActive(true);
          // Use a very short timeout to ensure UI has time to update
          setTimeout(() => {
            // Store logout message in session storage so it persists through page reload
            sessionStorage.setItem('logout_message', 'You have been successfully logged out');
            window.location.href = '/auth'; // Redirect to auth page
          }, 100);
        }
      } catch (error) {
        console.error("Critical error during logout:", error);
        setErrorMessage("Error during logout. Redirecting...");
        
        // Fallback redirect
        if (!redirectTimeoutActive) {
          setRedirectTimeoutActive(true);
          sessionStorage.setItem('logout_message', 'You have been successfully logged out');
          window.location.href = '/auth';
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
        sessionStorage.setItem('logout_message', 'You have been successfully logged out');
        window.location.href = '/auth';
      }
    }, 3000);
    
    // Clean up the fallback timer
    return () => clearTimeout(fallbackTimer);
  }, [queryClient, redirectTimeoutActive]);

  // Simple spinner with minimal dependencies
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Logging out...</p>
        {errorMessage && (
          <p className="text-sm text-amber-500 mt-2">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}