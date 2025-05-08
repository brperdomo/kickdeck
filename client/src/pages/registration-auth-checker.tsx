import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Component that handles authentication check for registration pages
 * It will automatically redirect to login if needed
 */
export default function RegistrationAuthChecker({ 
  children, 
  eventId 
}: { 
  children: React.ReactNode;
  eventId: string;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Effect to handle redirecting to login when not authenticated
  useEffect(() => {
    if (!user && !authLoading) {
      console.log("RegistrationAuthChecker: User not authenticated, redirecting to login");
      setIsRedirecting(true);
      
      // Store return URL in sessionStorage for post-login redirect
      const redirectPath = `/register/event/${eventId}`;
      sessionStorage.setItem('redirectAfterAuth', redirectPath);
      
      // Use setTimeout to ensure the state update happens before redirect
      // Use direct navigation to root path for login, which was the original behavior
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }, [user, authLoading, eventId, setLocation]);
  
  // Effect to handle the case where we've just returned from login
  useEffect(() => {
    // In production, we need to check if we're coming back from login even without the explicit flag
    const checkForRedirectScenario = () => {
      // Check for the flag that indicates we've just completed a login redirect
      const authRedirectCompleted = sessionStorage.getItem('authRedirectCompleted');
      
      // Also check referrer - this helps catch redirect completion when the flag might not be set
      const referrer = document.referrer;
      const comingFromAuth = referrer && (referrer.includes('/auth') || referrer.includes('/login'));
      
      // Check URL parameters for redirect=done which we'll add to the auth redirect
      const urlParams = new URLSearchParams(window.location.search);
      const redirectDone = urlParams.get('redirect') === 'done';
      
      return authRedirectCompleted || comingFromAuth || redirectDone;
    };

    // If we detect any sign of a completed auth redirect, refresh auth state
    if (checkForRedirectScenario()) {
      console.log("RegistrationAuthChecker: Detected auth redirect scenario, forcing authentication refresh");
      
      // Clear the flag immediately to prevent multiple refreshes
      sessionStorage.removeItem('authRedirectCompleted');
      
      // Remove any URL parameters that might indicate redirect
      if (window.location.search) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      // Force a fresh fetch of user data by invalidating the query cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Also make a direct fetch to ensure the server session is recognized
      // We'll try multiple times with increasing delays in case of production cookie propagation issues
      const fetchFreshUserData = async (attempt = 1, maxAttempts = 3) => {
        try {
          console.log(`RegistrationAuthChecker: Fetching fresh user data (attempt ${attempt}/${maxAttempts})`);
          const timestamp = Date.now();
          const response = await fetch(`/api/user?t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Cache-Bust': timestamp.toString()
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log("RegistrationAuthChecker: Fresh user data fetched:", userData ? 'success' : 'not found');
            
            // Update the query cache with fresh data
            queryClient.setQueryData(["/api/user"], userData);
            
            // If we have user data, force an immediate refresh of the UI
            if (userData) {
              // Force the component to re-render
              queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            } else if (attempt < maxAttempts) {
              // If no user data but we have more attempts, try again with exponential backoff
              const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s...
              console.log(`No user data found, retrying in ${delay}ms...`);
              setTimeout(() => fetchFreshUserData(attempt + 1, maxAttempts), delay);
            }
          } else if (attempt < maxAttempts) {
            // For non-successful responses, retry with backoff
            const delay = Math.pow(2, attempt) * 500;
            console.log(`Authentication fetch failed with status ${response.status}, retrying in ${delay}ms...`);
            setTimeout(() => fetchFreshUserData(attempt + 1, maxAttempts), delay);
          }
        } catch (e) {
          console.error('RegistrationAuthChecker: Error fetching fresh user data:', e);
          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 500;
            console.log(`Error during fetch, retrying in ${delay}ms...`);
            setTimeout(() => fetchFreshUserData(attempt + 1, maxAttempts), delay);
          }
        }
      };
      
      // Start the fetch process with delay to allow cookies to be properly set
      setTimeout(() => fetchFreshUserData(), 300);
    }
  }, [queryClient]);
  
  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show redirecting message while redirecting
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-primary-foreground font-medium">Redirecting to login...</p>
      </div>
    );
  }
  
  // If user is authenticated, render children
  return <>{children}</>;
}