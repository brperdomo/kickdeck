import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import HouseholdPage from "@/pages/household";
import { useUser } from "@/hooks/use-user";

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle unauthenticated routes
  if (!user) {
    if (window.location.pathname !== "/" && 
        window.location.pathname !== "/forgot-password" && 
        window.location.pathname !== "/register") {
      window.location.href = "/";
      return null;
    }
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  // Handle authenticated routes
  return (
    <Switch>
      <Route path="/admin">
        {user.isAdmin ? <AdminDashboard /> : <NotFound />}
      </Route>
      <Route path="/household" component={HouseholdPage} />
      <Route path="/">
        {user.isAdmin ? <AdminDashboard /> : <UserDashboard />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;