import { useEffect, useState } from "react";
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
  
  useEffect(() => {
    if (!user && !authLoading) {
      console.log("RegistrationAuthChecker: User not authenticated, redirecting to login");
      setIsRedirecting(true);
      
      // Store return URL in sessionStorage for post-login redirect
      const redirectPath = `/register/event/${eventId}`;
      sessionStorage.setItem('redirectAfterAuth', redirectPath);
      
      // Use setTimeout to ensure the state update happens before redirect
      // Use wouter's setLocation for client-side navigation instead of direct window manipulation
      setTimeout(() => {
        setLocation('/auth');
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