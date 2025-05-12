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

        // Redirect to login if not authenticated
        if (!user || authState === 'unauthenticated') {
          // Set a redirectAfterAuth in sessionStorage to return later
          sessionStorage.setItem('redirectAfterAuth', location);
          console.log('ProtectedRoute: User not authenticated, redirecting to auth');
          
          // Update state to indicate redirection is happening
          setAuthState('redirecting');
          
          return <Redirect to="/auth" />;
        }

        // Role-based checks
        if (requiredRole === "admin" && !user.isAdmin) {
          console.log('ProtectedRoute: User not authorized for admin route, redirecting to dashboard');
          
          // Update state to indicate redirection is happening
          setAuthState('redirecting');
          
          return <Redirect to="/dashboard" />;
        }

        // Render the component if all checks pass
        console.log('ProtectedRoute: All checks passed, rendering component');
        return typeof Component === "function" 
          ? <Component />
          : Component;
      }}
    </Route>
  );
}