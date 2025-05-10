import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Component that handles authentication check for registration pages
 * It will automatically redirect to login if needed
 * 
 * SIMPLIFIED VERSION: This component now handles a simpler flow
 * - If user is not logged in: redirect to login page
 * - If user is logged in: simply render children (no step management)
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
  const queryClient = useQueryClient();
  const initialCheckDone = useRef(false);
  
  // Force a fresh user data fetch on mount
  useEffect(() => {
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      
      // Force a fresh fetch of user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Make a direct fetch with cache-busting to ensure we get fresh data
      fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        headers: { 
          'Cache-Control': 'no-cache',
          'X-Cache-Bust': Date.now().toString()
        }
      })
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        if (userData) {
          console.log("Registration: User is authenticated", userData.email);
          queryClient.setQueryData(["/api/user"], userData);
        }
      })
      .catch(e => {
        console.error('Error checking auth status:', e);
      });
    }
  }, [queryClient]);
  
  // Simple redirect to login if not authenticated
  useEffect(() => {
    // Wait until loading is complete and we've done our initial check
    if (!authLoading && initialCheckDone.current && !user) {
      console.log("Registration: User not authenticated, redirecting to login");
      setIsRedirecting(true);
      
      // Store return URL for post-login redirect
      const redirectPath = `/register/event/${eventId}`;
      sessionStorage.setItem('redirectAfterAuth', redirectPath);
      
      // Redirect to login page
      window.location.href = '/';
    }
  }, [user, authLoading, eventId]);
  
  // Handle redirect parameters and cleanup after login
  useEffect(() => {
    console.log("RegistrationAuthChecker: Checking registration URL parameters");
    
    // Check for any post-login redirect parameters and clean them up
    const params = new URLSearchParams(window.location.search);
    
    // Don't redirect if we're already in the registration flow with auth_complete
    const isAuthComplete = params.has('auth_complete');
    
    if (params.has('redirect') || params.has('force_refresh') || isAuthComplete) {
      console.log('Cleaning up auth-related URL parameters');
      
      // Clear any auth-related session storage items
      sessionStorage.removeItem('authRedirectCompleted');
      
      // Clean up the URL by removing parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Store a flag to prevent further redirects while in registration
      sessionStorage.setItem('inRegistrationFlow', 'true');
    }
  }, []);
  
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
  // This will only be reached if the user is authenticated
  // since the redirecting logic handles all other cases
  return <>{children}</>;
}