import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import RegisterPage from "./pages/register";
import CreateEventPage from "./pages/create-event";
import SignUpPage from "./pages/register"; // Changed from "./pages/signup" to "./pages/register"
import EventListPage from "./pages/event-list";
import EventDetailsPage from "./pages/events/[id]";
import EventApplicationPage from "./pages/events/[id]/apply";
import EditEventPage from "./pages/admin/events/[id]/edit";
import CreateAdminPage from "./pages/admin/create";
import ScoresPage from "./pages/admin/scores";
import UsersPage from "./pages/admin/users";
import AdminChatPage from "./pages/admin/chat";
import SchedulePage from "./pages/admin/schedule";
import SettingsPage from "./pages/admin/settings";
import FinancePage from "./pages/admin/finance";
import TeamsPage from "./pages/admin/teams";
import AnnouncementsPage from "./pages/admin/announcements";
import ReportsPage from "./pages/admin/reports";
import FormTemplatesPage from "./pages/admin/form-templates";
import CreateFormTemplatePage from "./pages/admin/form-templates/create";
import EditFormTemplatePage from "./pages/admin/form-templates/[id]/edit";
import NotFoundPage from "./pages/404";
import { AuthProvider } from "./hooks/use-auth";
import { useTheme } from "./hooks/use-theme";
import AdminLayout from "./components/layouts/admin-layout";
import EmailTemplatesPage from "./pages/admin/email-templates";
import { useUser } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./pages/admin/dashboard";
import ForgotPassword from "@/pages/forgot-password";
import AuthPage from "@/pages/auth-page";


// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
    return (
      <Switch>
        <Route path="/register" component={RegisterPage} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/signup" component={SignUpPage} />
      <Route path="/events" component={EventListPage} />
      <Route path="/events/:id" component={EventDetailsPage} />
      <Route path="/events/:id/apply" component={EventApplicationPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/create" component={CreateEventPage} /> {/* Changed import and route */}
      <Route path="/admin/create-event" component={CreateEventPage} />
      <Route path="/admin/events/:id/edit" component={EditEventPage} />
      <Route path="/admin/scores" component={ScoresPage} />
      <Route path="/admin/users" component={UsersPage} />
      <Route path="/admin/chat" component={AdminChatPage} />
      <Route path="/admin/schedule" component={SchedulePage} />
      <Route path="/admin/settings" component={SettingsPage} />
      <Route path="/admin/finance" component={FinancePage} />
      <Route path="/admin/teams" component={TeamsPage} />
      <Route path="/admin/announcements" component={AnnouncementsPage} />
      <Route path="/admin/reports" component={ReportsPage} />
      <Route path="/admin/form-templates" component={FormTemplatesPage} />
      <Route path="/admin/form-templates/create" component={CreateFormTemplatePage} />
      <Route path="/admin/form-templates/:id/edit" component={EditFormTemplatePage} />
      <Route path="/admin/email-templates" component={EmailTemplatesPage} />
      <Route path="/:rest*" component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  const { theme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme={theme}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;