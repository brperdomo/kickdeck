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
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCount, setRedirectCount] = useState(0);
  
  useEffect(() => {
    // Track redirects to prevent loops
    if (redirectCount > 5) {
      console.error("Too many redirects detected! Stopping to prevent infinite loop.");
      return;
    }
    
    // Don't do anything if we're still loading or there's no user
    if (isLoading) {
      console.log("RoleBasedRedirect - Still loading, skipping redirect");
      return;
    }
    
    // If no user data and not loading, we should not continue
    if (!user) {
      console.log("RoleBasedRedirect - No user data available");
      return;
    }

    // Log for debugging
    console.log("RoleBasedRedirect checking access", { 
      path: location, 
      isAdmin: user?.isAdmin,
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
      setIsRedirecting(true);
      setRedirectCount(prev => prev + 1);
      setTimeout(() => {
        setLocation('/dashboard');
        setIsRedirecting(false);
      }, 100);
      return;
    }
    
    // Handle member routes when user is an admin only
    if ((path === '/dashboard' || path.startsWith('/dashboard/')) && user.isAdmin) {
      console.log("Admin accessing member route, redirecting to admin panel");
      setIsRedirecting(true);
      setRedirectCount(prev => prev + 1);
      setTimeout(() => {
        setLocation('/admin');
        setIsRedirecting(false);
      }, 100);
      return;
    }
    
    // Handle root path based on role
    if (path === '/') {
      const targetPath = user.isAdmin ? '/admin' : '/dashboard';
      console.log(`User at root path, redirecting to ${targetPath}`);
      setIsRedirecting(true);
      setRedirectCount(prev => prev + 1);
      setTimeout(() => {
        setLocation(targetPath);
        setIsRedirecting(false);
      }, 100);
      return;
    }
    
  }, [user, isLoading, location, setLocation, redirectCount]);
  
  // Show loading indicator during redirects to prevent white flash
  if (isRedirecting) {
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