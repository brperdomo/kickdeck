import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./admin-dashboard";
// Import useAuth for API call helper
import { useAuth } from "@/hooks/use-auth";

/**
 * This component serves as a reliable entry point to the admin dashboard
 * By using a fresh component without dependencies on complex routing logic,
 * we avoid auth state synchronization issues
 */
export default function AdminDirectView() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isLoading, authState } = useAuth();
  
  // Check for auth on mount - use both the hook and direct API
  useEffect(() => {
    console.log("AdminDirectView mounted, checking auth state:", { user, isLoading, authState });
    
    // First check hook-based auth
    if (!isLoading) {
      if (user && user.isAdmin) {
        console.log("Auth hook provided admin user data");
        setIsLoaded(true);
        return;
      } else if (user) {
        console.log("User is authenticated but not an admin");
        window.location.href = '/dashboard';
        return;
      }
    }
    
    // Next check session storage for auth info as backup
    const storedIsAuthenticated = sessionStorage.getItem('user_authenticated') === 'true';
    const storedIsAdmin = sessionStorage.getItem('user_is_admin') === 'true';
    
    if (storedIsAuthenticated && storedIsAdmin) {
      console.log("Using session storage backup admin auth");
      setIsLoaded(true);
      return;
    }
    
    // As last resort, make a direct API call to verify auth
    const checkAuth = async () => {
      try {
        console.log("Making direct API auth check");
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Direct API auth check returned:", userData);
          
          if (userData && userData.isAdmin) {
            console.log("Direct API auth confirmed admin status");
            // Store backup auth data
            sessionStorage.setItem('user_authenticated', 'true');
            sessionStorage.setItem('user_is_admin', 'true');
            setIsLoaded(true);
          } else {
            console.log("Direct API auth: user not admin");
            window.location.href = '/dashboard';
          }
        } else {
          console.log("Direct API auth check failed, redirecting to login");
          window.location.href = '/auth';
        }
      } catch (e) {
        console.error("Error in direct API auth check:", e);
        // Last chance: only consider stored values if we're sure API is failing
        if (storedIsAuthenticated && storedIsAdmin) {
          console.log("Using backup auth after API error");
          setIsLoaded(true);
        } else {
          window.location.href = '/auth';
        }
      }
    };
    
    // Only do direct API check if hook and session storage checks failed
    if (isLoading || (!user && !storedIsAuthenticated)) {
      checkAuth();
    }
    
    // Add an additional safety timeout - if component doesn't load in 5 seconds, try reload
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.log("AdminDirectView: Timeout reached, reloading page");
        window.location.reload();
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [user, isLoading, authState, isLoaded]);
  
  // Show loading initially
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg mt-4">Loading admin dashboard...</p>
      </div>
    );
  }
  
  // Extra check to prevent rendering without proper auth
  const storedIsAdmin = sessionStorage.getItem('user_is_admin') === 'true';
  
  // Once loaded, render the admin dashboard directly 
  // Pass initialView to avoid any props type errors
  return <AdminDashboard initialView="events" />;
}