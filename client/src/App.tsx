import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AdminDashboardPage from "@/pages/admin-dashboard";
import NotFoundPage from "@/pages/not-found-page";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry queries once by default
      refetchOnWindowFocus: false,
    },
  },
});

// Debug component to see current route location
function RouteDebugger() {
  console.log("Current URL:", window.location.href);
  return null;
}

export default function App() {
  console.log("App rendering");
  
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouteDebugger />
          <Switch>
            {/* Public routes */}
            <Route path="/auth" component={AuthPage} />
            
            {/* Protected routes */}
            <ProtectedRoute path="/" component={DashboardPage} />
            <ProtectedRoute path="/admin" component={AdminDashboardPage} />
            <ProtectedRoute path="/dashboard" component={DashboardPage} />
            
            {/* Catch-all route */}
            <Route component={NotFoundPage} />
          </Switch>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}