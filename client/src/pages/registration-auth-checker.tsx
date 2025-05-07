import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

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
  const hasRedirectedRef = useRef(false);
  
  // DIRECT CHECK METHOD - Simply check if user is logged in
  // and redirect to auth page if not
  useEffect(() => {
    // Skip if already redirected, already loading, or user is logged in
    if (hasRedirectedRef.current || authLoading || user) {
      return;
    }
    
    // Only redirect if user is not authenticated and we're done loading
    if (!user && !authLoading) {
      console.log("RegistrationAuthChecker: User not authenticated, redirecting to login", {
        eventId,
        authStatus: { user: !!user, authLoading }
      });
      
      // Set flag to prevent multiple redirects
      hasRedirectedRef.current = true;
      setIsRedirecting(true);
      
      // Store absolute URL in sessionStorage for more reliable post-login redirect
      const redirectUrl = `/register/event/${eventId}`;
      console.log("RegistrationAuthChecker: Setting redirect URL:", redirectUrl);
      
      // Clear any existing redirect first to avoid stale values
      sessionStorage.removeItem('redirectAfterAuth');
      
      // Then set the new redirect path
      sessionStorage.setItem('redirectAfterAuth', redirectUrl);
      
      // Navigate directly to the auth page with a clear flag
      setTimeout(() => {
        window.location.href = `/auth?eventId=${eventId}&from=registration&t=${Date.now()}`;
      }, 100);
    }
  }, [user, authLoading, eventId, setLocation]);
  
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