import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  allowUnauthenticated?: boolean;
};

export function ProtectedRoute({ 
  path, 
  component: Component,
  allowUnauthenticated = false
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  console.log("AUTH FIX: Rendering protected route at", path, { 
    user, 
    isLoading, 
    allowUnauthenticated 
  });
  
  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          // Show loading state
          console.log("AUTH DEBUG: Loading user data");
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user && !allowUnauthenticated) {
          // Redirect to login page if not authenticated
          console.log("AUTH FIX: User not authenticated, redirecting to /auth");
          return <Redirect to="/auth" />;
        }

        // Render the protected component
        return <Component />;
      }}
    </Route>
  );
}