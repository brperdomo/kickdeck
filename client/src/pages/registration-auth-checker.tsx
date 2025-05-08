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
    // Check for the flag that indicates we've just completed a login redirect
    const authRedirectCompleted = sessionStorage.getItem('authRedirectCompleted');
    
    if (authRedirectCompleted) {
      console.log("RegistrationAuthChecker: Detected completed auth redirect, forcing authentication refresh");
      
      // Clear the flag immediately to prevent multiple refreshes
      sessionStorage.removeItem('authRedirectCompleted');
      
      // Force a fresh fetch of user data by invalidating the query cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Also make a direct fetch to ensure the server session is recognized
      const fetchFreshUserData = async () => {
        try {
          console.log("RegistrationAuthChecker: Fetching fresh user data");
          const timestamp = Date.now();
          const response = await fetch(`/api/user?t=${timestamp}`, {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Cache-Bust': timestamp.toString()
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log("RegistrationAuthChecker: Fresh user data fetched:", userData ? 'success' : 'not found');
            
            // Update the query cache with fresh data
            queryClient.setQueryData(["/api/user"], userData);
          }
        } catch (e) {
          console.error('RegistrationAuthChecker: Error fetching fresh user data:', e);
        }
      };
      
      fetchFreshUserData();
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