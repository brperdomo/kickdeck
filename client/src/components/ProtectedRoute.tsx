import { ReactNode, useState, useEffect } from "react";
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
  const { user, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [location] = useLocation();
  
  // Improved handling of auth state to prevent white screen flashes
  useEffect(() => {
    console.log('ProtectedRoute', { path, location, user, isLoading, isRedirecting });
    
    // Pre-fetch the necessary data when component mounts
    if (!isLoading && !user) {
      // Ensure a smooth redirection with visual feedback
      setIsRedirecting(true);
    }
  }, [path, location, user, isLoading]);

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while checking auth
        if (isLoading || isRedirecting) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">
                {isRedirecting ? "Redirecting..." : "Loading..."}
              </p>
            </div>
          );
        }

        // Redirect to login if not authenticated
        if (!user) {
          // Set a redirectAfterAuth in sessionStorage to return later
          sessionStorage.setItem('redirectAfterAuth', location);
          console.log('ProtectedRoute: User not authenticated, redirecting to auth');
          return <Redirect to="/auth" />;
        }

        // Role-based checks
        if (requiredRole === "admin" && !user.isAdmin) {
          console.log('ProtectedRoute: User not authorized for admin route, redirecting to dashboard');
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