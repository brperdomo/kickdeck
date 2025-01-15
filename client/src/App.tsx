import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Loader2, Lock } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin-dashboard";
import CreateEvent from "@/pages/create-event";
import ForgotPassword from "@/pages/forgot-password";
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

  return (
    <Switch>
      {user ? (
        <>
          <Route path="/" component={user.isAdmin ? AdminDashboard : Profile} />
          <Route path="/admin" component={AdminDashboard} />
          {user.isAdmin && <Route path="/create-event" component={CreateEvent} />}
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="*" component={AuthPage} />
        </>
      )}
    </Switch>
  );
}

function App() {
  const isDev = import.meta.env.DEV;
  const bypassAuth = isDev && import.meta.env.VITE_BYPASS_AUTH === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
      {bypassAuth && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md shadow-lg flex items-center gap-2 border border-yellow-200">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">Auth Bypass Active</span>
        </div>
      )}
    </QueryClientProvider>
  );
}

export default App;