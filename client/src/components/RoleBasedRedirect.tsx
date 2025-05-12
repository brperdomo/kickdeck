import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

/**
 * RoleBasedRedirect Component
 * 
 * Redirects users based on their role when they access restricted areas:
 * - Regular users trying to access admin routes are redirected to the dashboard
 * - Admin users trying to access member routes are redirected to the admin panel
 */
export function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Wait until user data is loaded
    if (isLoading || !user) return;
    
    // Extract the current path for easier checking
    const path = location.toLowerCase();
    
    // Don't redirect if the user is in the process of registration or other special flows
    if (path.includes('/register/event/') || 
        path.includes('/event/') || 
        path.includes('/reset-password') ||
        path.includes('/forgot-password') ||
        path.includes('/auth') ||
        path.includes('/login') ||
        path.includes('/logout')) {
      return;
    }
    
    // Handle admin routes when user is not an admin
    if ((path === '/admin' || path.startsWith('/admin/')) && !user.isAdmin) {
      console.log("User is not an admin, redirecting to dashboard");
      setLocation('/dashboard');
      return;
    }
    
    // Handle member routes when user is only an admin (no member role)
    if ((path === '/dashboard' || path.startsWith('/dashboard/')) && user.isAdmin) {
      // In the future, we might want to check if the admin also has member permissions
      // For now, we'll just redirect to the admin panel
      console.log("Admin user accessing member route, redirecting to admin panel");
      setLocation('/admin');
      return;
    }
    
    // Handle root path based on user's role
    if (path === '/') {
      if (user.isAdmin) {
        console.log("Admin user at root path, redirecting to admin panel");
        setLocation('/admin');
      } else {
        console.log("Regular user at root path, redirecting to dashboard");
        setLocation('/dashboard');
      }
    }
  }, [user, isLoading, location, setLocation]);
  
  // This component doesn't render anything, it just performs redirects
  return null;
}