import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

/**
 * RoleBasedRedirect Component
 * 
 * Intelligently redirects users based on their role:
 * - Root path (/) redirects to /admin for admins or /dashboard for regular members
 * - Regular users trying to access admin routes are redirected to the dashboard
 * - Admin users trying to access member routes are redirected to the admin panel
 * - Non-protected routes are left alone for all users
 * 
 * This component works in conjunction with ProtectedRoute for a complete
 * role-based access control system throughout the application.
 */
export function RoleBasedRedirect() {
  const { user, isLoading, authState, setAuthState } = useAuth();
  const [location, setLocation] = useLocation();
  const [redirectCount, setRedirectCount] = useState(0);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    // Track redirects to prevent loops
    if (redirectCount > 5) {
      console.error("Too many redirects detected! Stopping to prevent infinite loop.");
      setAuthState('authenticated'); // Force auth state to authenticated to stop redirects
      return;
    }
    
    // Enhanced logging for debugging
    console.log("RoleBasedRedirect - Current state:", {
      isLoading,
      authState,
      user,
      location,
      redirectCount
    });

    // Don't do anything if we're still loading or in a transitional state
    if (isLoading || !user || authState === 'checking' || authState === 'logging-in' || 
        authState === 'logging-out' || authState === 'redirecting') {
      console.log("RoleBasedRedirect - Still loading or in transition, skipping redirect", { authState });
      return;
    }

    // Ensure we have valid user data before proceeding
    if (authState === 'authenticated' && user) {
      console.log("RoleBasedRedirect - User authenticated:", { 
        isAdmin: user.isAdmin,
        currentPath: location 
      });
    }
    
    // If no user data and not loading, we should not continue
    if (!user || authState === 'unauthenticated') {
      console.log("RoleBasedRedirect - No user data available or unauthenticated");
      return;
    }

    // Log for debugging
    console.log("RoleBasedRedirect checking access", { 
      path: location, 
      isAdmin: user?.isAdmin,
      authState,
      user
    });
    
    // Extract current path
    const path = location.toLowerCase();
    
    // Skip redirects for non-protected paths
    const nonProtectedPaths = [
      '/register', 
      '/event', 
      '/reset-password',
      '/forgot-password',
      '/auth',
      '/login',
      '/logout',
      '/auth-logged-out',
      '/admin-emergency',
      '/admin-direct'
    ];
    
    // Check if the current path matches any of the non-protected paths
    if (nonProtectedPaths.some(nonProtectedPath => path.includes(nonProtectedPath))) {
      console.log("Path is non-protected:", path);
      return;
    }
    
    // Handle admin routes
    if (path === '/admin' || path.startsWith('/admin/')) {
      if (!user.isAdmin) {
        console.log("Non-admin accessing admin route, redirecting to dashboard");
        setAuthState('redirecting');
        setRedirectCount(prev => prev + 1);
        setTimeout(() => {
          setLocation('/dashboard');
          setAuthState('authenticated');
          setHasRedirected(true);
        }, 100);
        return;
      } else {
        console.log("Admin accessing admin route, ensuring authentication state");
        if (!hasRedirected) {
          setAuthState('authenticated');
          setHasRedirected(true);
        }
        return;
      }
    }
    
    // Handle member routes when user is an admin only
    // TEMPORARILY DISABLED to fix login redirect issue
    // This was causing admins to be redirected away from /dashboard after login
    /*
    if ((path === '/dashboard' || path.startsWith('/dashboard/')) && user.isAdmin) {
      console.log("Admin accessing member route, redirecting to admin panel");
      // Set auth state to redirecting to show proper UI feedback
      setAuthState('redirecting');
      setRedirectCount(prev => prev + 1);
      setTimeout(() => {
        setLocation('/admin');
        // Reset auth state after redirect is complete
        if (user) {
          setAuthState('authenticated');
          setHasRedirected(true);
        }
      }, 100);
      return;
    }
    */
    
    // Handle root path based on role
    if (path === '/') {
      const targetPath = user.isAdmin ? '/admin' : '/dashboard';
      console.log(`User at root path, redirecting to ${targetPath}`);
      // Set auth state to redirecting to show proper UI feedback
      setAuthState('redirecting');
      setRedirectCount(prev => prev + 1);
      
      // Force a direct navigation to the target path
      setTimeout(() => {
        // Use window.location for a more forceful navigation if needed
        if (redirectCount > 2) {
          console.log("Using window.location for forceful redirect");
          window.location.href = targetPath;
          return;
        }
        
        setLocation(targetPath);
        // Reset auth state after redirect is complete
        if (user) {
          setAuthState('authenticated');
          setHasRedirected(true);
        }
      }, 100);
      return;
    }
    
    // If we're on the admin or dashboard route but haven't rendered yet
    if ((path === '/admin' || path === '/dashboard') && !hasRedirected) {
      console.log("On target route but component may not be rendered yet, forcing refresh", { 
        path,
        isAdmin: user?.isAdmin,
        authState,
        hasRedirected
      });
      
      // Force a refresh of the current route
      setAuthState('authenticated');
      setHasRedirected(true);
    }
    
  }, [user, isLoading, authState, location, setLocation, redirectCount, setAuthState, hasRedirected]);
  
  // Show loading indicator during redirects to prevent white flash
  if (authState === 'redirecting') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting...</span>
      </div>
    );
  }
  
  // No rendering when not redirecting
  return null;
}