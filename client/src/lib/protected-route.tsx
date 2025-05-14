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
  allowUnauthenticated = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  console.log('AUTH FIX: Rendering protected route at', path, { user, isLoading, allowUnauthenticated });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated and authentication is required
  if (!user && !allowUnauthenticated) {
    console.log('AUTH FIX: User not authenticated, redirecting to /auth');
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If authentication check passed, render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}