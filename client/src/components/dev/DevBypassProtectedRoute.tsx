import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Bug } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button"; 

type DevBypassProtectedRouteProps = {
  path: string;
  requiredRole?: "admin" | "member";
  component: ReactNode | (() => JSX.Element);
};

/**
 * DevBypassProtectedRoute Component
 * 
 * A development-only version of ProtectedRoute that allows access to routes
 * that would normally require authentication, specifically for development and testing.
 * 
 * In development mode, it will show a warning banner but allow access to the protected route.
 * In production, it behaves exactly like the normal ProtectedRoute.
 * 
 * @param path - The route path to match
 * @param requiredRole - Optional role requirement ("admin" or "member")
 * @param component - The component to render when conditions are met
 */
export function DevBypassProtectedRoute({ 
  path, 
  requiredRole,
  component: Component 
}: DevBypassProtectedRouteProps) {
  const { user, isLoading, authState, setAuthState } = useAuth();
  const [location] = useLocation();
  const [isDevelopment, setIsDevelopment] = useState(true);
  const [bypassActive, setBypassActive] = useState(false);
  
  // Check if we're in development mode on component mount
  useEffect(() => {
    // In real production, we'd check NODE_ENV, but for our Replit setup
    // we'll consider it production if deployed on certain domains
    const hostname = window.location.hostname;
    const isProd = hostname.includes('replit.app') || 
                   hostname.includes('matchpro.ai');
    
    setIsDevelopment(!isProd);
  }, []);

  // Improved handling of auth state to prevent white screen flashes
  useEffect(() => {
    console.log('DevBypassProtectedRoute', { path, location, user, authState, isLoading, isDevelopment, bypassActive });
    
    // Update redirection state based on auth status
    if (!isLoading && !user && authState === 'unauthenticated' && !bypassActive) {
      // Store the current location for post-login redirect
      sessionStorage.setItem('redirectAfterAuth', location);
    }
  }, [path, location, user, authState, isLoading, bypassActive]);

  // Handler for activating the bypass
  const handleBypass = () => {
    setBypassActive(true);
    console.log('Development auth bypass activated');
  };

  return (
    <Route path={path}>
      {() => {
        // Show loading indicator while checking auth
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

        // In development mode, we allow bypass
        if (isDevelopment && !user && !bypassActive) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
              <Alert className="max-w-md bg-yellow-100 border-yellow-400 text-yellow-800">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  This route requires {requiredRole || "authentication"} in production.
                  You can bypass this check in development mode.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={handleBypass} variant="secondary">
                  <Bug className="mr-2 h-4 w-4" />
                  Bypass Authentication
                </Button>
                
                <Button onClick={() => window.location.href = '/auth'} variant="default">
                  Go to Login
                </Button>
              </div>
            </div>
          );
        }

        // In development with bypass active, allow access
        if (isDevelopment && bypassActive) {
          return (
            <div className="relative">
              {/* Warning banner */}
              <div className="sticky top-0 bg-yellow-500/80 text-black z-50 py-1 px-4 text-sm flex justify-between items-center backdrop-blur-sm">
                <span className="flex items-center">
                  <Bug className="h-4 w-4 mr-2" />
                  Development mode: Authentication bypassed
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setBypassActive(false)}
                  className="h-6 text-xs"
                >
                  Disable Bypass
                </Button>
              </div>
              
              {/* Render the actual component */}
              {typeof Component === "function" 
                ? <Component />
                : Component}
            </div>
          );
        }

        // In production (or dev without bypass), follow normal ProtectedRoute logic
        
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