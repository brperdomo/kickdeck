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
  
  useEffect(() => {
    // Track redirects to prevent loops
    if (redirectCount > 5) {
      console.error("Too many redirects detected! Stopping to prevent infinite loop.");
      return;
    }
    
    // Don't do anything if we're still loading or in a transitional state
    if (isLoading || authState === 'checking' || authState === 'logging-in' || 
        authState === 'logging-out' || authState === 'redirecting') {
      console.log("RoleBasedRedirect - Still loading or in transition, skipping redirect", { authState });
      return;
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
      '/auth-logged-out'
    ];
    
    // Check if the current path matches any of the non-protected paths
    if (nonProtectedPaths.some(nonProtectedPath => path.includes(nonProtectedPath))) {
      console.log("Path is non-protected:", path);
      return;
    }
    
    // Handle admin routes when user is not an admin
    if ((path === '/admin' || path.startsWith('/admin/')) && !user.isAdmin) {
      console.log("Non-admin accessing admin route, redirecting to dashboard");
      // Set auth state to redirecting to show proper UI feedback
      setAuthState('redirecting');
      setRedirectCount(prev => prev + 1);
      setTimeout(() => {
        setLocation('/dashboard');
        // Reset auth state after redirect is complete
        if (user) {
          setAuthState('authenticated');
        }
      }, 100);
      return;
    }
    
    // Handle member routes when user is an admin only
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
        }
      }, 100);
      return;
    }
    
    // Handle root path based on role
    if (path === '/') {
      const targetPath = user.isAdmin ? '/admin' : '/dashboard';
      console.log(`User at root path, redirecting to ${targetPath}`);
      // Set auth state to redirecting to show proper UI feedback
      setAuthState('redirecting');
      setRedirectCount(prev => prev + 1);
      setTimeout(() => {
        setLocation(targetPath);
        // Reset auth state after redirect is complete
        if (user) {
          setAuthState('authenticated');
        }
      }, 100);
      return;
    }
    
  }, [user, isLoading, authState, location, setLocation, redirectCount, setAuthState]);
  
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