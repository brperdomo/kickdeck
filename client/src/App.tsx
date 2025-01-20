import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2, Lock } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin-dashboard";
import CreateEvent from "@/pages/create-event";
import EditEvent from "@/pages/edit-event";
import ForgotPassword from "@/pages/forgot-password";
import Chat from "@/pages/chat";
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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/create-event">
        {user.isAdmin ? <CreateEvent /> : <NotFound />}
      </Route>
      <Route path="/admin/events/:id">
        {user.isAdmin ? <EditEvent /> : <NotFound />}
      </Route>
      <Route path="/chat" component={Chat} />
      <Route path="/">
        {user.isAdmin ? <AdminDashboard /> : <Profile />}
      </Route>
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  const isDev = import.meta.env.DEV;
  const bypassAuth = isDev && import.meta.env.VITE_BYPASS_AUTH === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
        {bypassAuth && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md shadow-lg flex items-center gap-2 border border-yellow-200">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Auth Bypass Active</span>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;