import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

type ProtectedRouteProps = {
  path: string;
  requiredRole?: "admin" | "member";
  component: ReactNode | (() => JSX.Element);
};

/**
 * ProtectedRoute Component
 * 
 * A route component that protects routes based on authentication status and roles.
 * - If the user is not logged in, they are redirected to the auth page
 * - If an admin role is required and the user is not an admin, they are redirected
 * - If a member role is required and the user is an admin, they can still access the route
 * 
 * @param path - The route path to match
 * @param requiredRole - Optional role requirement ("admin" or "member")
 * @param component - The component to render when conditions are met
 */
export function ProtectedRoute({ 
  path, 
  requiredRole,
  component: Component 
}: ProtectedRouteProps) {
  const { user, isLoading, authState, setAuthState } = useAuth();
  const [location] = useLocation();
  
  // Improved handling of auth state to prevent white screen flashes
  useEffect(() => {
    console.log('ProtectedRoute', { path, location, user, authState, isLoading });
    
    // Update redirection state based on auth status
    if (!isLoading && !user && authState === 'unauthenticated') {
      // Store the current location for post-login redirect
      sessionStorage.setItem('redirectAfterAuth', location);
    }
  }, [path, location, user, authState, isLoading]);

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while checking auth or during transitions
        if (isLoading || authState === 'checking' || authState === 'redirecting') {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">
                {authState === 'redirecting' ? "Redirecting..." : "Loading..."}
              </p>
            </div>
          );
        }

        // Check for backup authentication (especially important for admin routes)
        let isAuthenticatedFromBackup = false;
        let isAdminFromBackup = false;
        
        // Try to get authentication status from session storage as a fallback
        if (!user && path.includes('/admin')) {
          console.log('ProtectedRoute: Checking for backup auth info');
          try {
            isAuthenticatedFromBackup = sessionStorage.getItem('user_authenticated') === 'true';
            isAdminFromBackup = sessionStorage.getItem('user_is_admin') === 'true';
            
            const authTimestamp = sessionStorage.getItem('auth_timestamp');
            // Only use backup if it's less than 30 minutes old
            if (authTimestamp) {
              const timeDiff = Date.now() - parseInt(authTimestamp);
              if (timeDiff > 30 * 60 * 1000) { // 30 minutes
                console.log('ProtectedRoute: Backup auth info is too old, ignoring');
                isAuthenticatedFromBackup = false;
                isAdminFromBackup = false;
              }
            }
            
            console.log('ProtectedRoute: Backup auth info', { 
              isAuthenticatedFromBackup, 
              isAdminFromBackup 
            });
          } catch (e) {
            console.warn('Failed to read auth backup from sessionStorage', e);
          }
        }
        
        // If we have valid backup auth for admin routes, render without redirect
        if (path.includes('/admin') && isAuthenticatedFromBackup && isAdminFromBackup) {
          console.log('ProtectedRoute: Using backup auth for admin access');
          // Add cookie to ensure API calls work
          document.cookie = "is_authenticated=true; path=/";
          
          // Redirect to admin-direct for more reliable handling
          window.location.href = '/admin-direct';
          
          // Show loading while redirecting
          return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Verifying admin access...</p>
            </div>
          );
        }
        
        // Standard redirect to login if not authenticated 
        if (!user || authState === 'unauthenticated') {
          // Set a redirectAfterAuth in sessionStorage to return later
          sessionStorage.setItem('redirectAfterAuth', location);
          console.log('ProtectedRoute: User not authenticated, redirecting to auth');
          
          // Update state to indicate redirection is happening
          setAuthState('redirecting');
          
          return <Redirect to="/auth" />;
        }

        // Role-based checks - with special case for admin routes
        if (requiredRole === "admin") {
          if (!user.isAdmin) {
            console.log('ProtectedRoute: User not authorized for admin route, redirecting to dashboard');
            
            // Update state to indicate redirection is happening
            setAuthState('redirecting');
            
            return <Redirect to="/dashboard" />;
          } else {
            // User is an admin accessing admin route - force a direct render for reliability
            console.log('ProtectedRoute: Admin accessing admin route - direct render mode');
            // Ensure we're in authenticated state
            if (authState !== 'authenticated') {
              setAuthState('authenticated');
            }
            
            // Force cookie update in case it was lost
            document.cookie = "is_authenticated=true; path=/";
          }
        }

        // Render the component if all checks pass
        console.log('ProtectedRoute: All checks passed, rendering component', {
          path,
          requiredRole,
          isAdmin: user.isAdmin,
          authState
        });
        
        // Make sure we're in the right auth state before rendering
        if (authState !== 'authenticated') {
          setAuthState('authenticated');
        }
        
        return typeof Component === "function" 
          ? <Component />
          : Component;
      }}
    </Route>
  );
}