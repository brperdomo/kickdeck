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
import CreateEvent from "@/pages/create-event";
import CouponManagement from "@/pages/coupon-management";
import AccountingCodeManagement from "@/pages/accounting-code-management";
import UserDashboard from "@/pages/user-dashboard";
import HouseholdPage from "@/pages/household";
import ChatPage from "@/pages/chat";
import EditEvent from "@/pages/edit-event";
import EventApplicationForm from "@/pages/event-application-form";
import { useUser } from "@/hooks/use-user";
import EventRegistration from "./pages/event-registration";
import { FeeManagement } from "@/components/events/FeeManagement";

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
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  // Handle authenticated routes
  return (
    <Switch>
      <Route path="/admin/events/create">
        {user.isAdmin ? <CreateEvent /> : <NotFound />}
      </Route>
      <Route path="/admin/events/:id/edit">
        {user.isAdmin ? <EditEvent /> : <NotFound />}
      </Route>
      <Route path="/admin/events/:id/application-form">
        {user.isAdmin ? <EventApplicationForm /> : <NotFound />}
      </Route>
      <Route path="/admin/events/:eventId/fees">
        {(params) => user.isAdmin ? <FeeManagement eventId={params.eventId} /> : <NotFound />}
      </Route>
      <Route path="/admin/events/:id">
        {user.isAdmin ? <EditEvent /> : <NotFound />}
      </Route>
      <Route path="/admin/events/:id/coupons">
        {user.isAdmin ? <CouponManagement /> : <NotFound />}
      </Route>
      <Route path="/admin/accounting-codes">
        {user.isAdmin ? <AccountingCodeManagement /> : <NotFound />}
      </Route>
      <Route path="/admin/events">
        {user.isAdmin ? <AdminDashboard /> : <NotFound />}
      </Route>
      <Route path="/admin">
        {user.isAdmin ? <AdminDashboard /> : <NotFound />}
      </Route>
      <Route path="/household" component={HouseholdPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/register/event/:eventId" component={EventRegistration} />
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
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import CreateEventPage from "./pages/create-event";
import SignUpPage from "./pages/signup";
import EventListPage from "./pages/events";
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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { theme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme={theme}>
        <AuthProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={LoginPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/signup" component={SignUpPage} />
            <Route path="/events" component={EventListPage} />
            <Route path="/events/:id" component={EventDetailsPage} />
            <Route path="/events/:id/apply" component={EventApplicationPage} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/create" component={CreateAdminPage} />
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
            <Route path="/admin/email-templates" component={EmailTemplatesPage} />
            <Route path="/admin/form-templates" component={FormTemplatesPage} />
            <Route path="/admin/form-templates/create" component={CreateFormTemplatePage} />
            <Route path="/admin/form-templates/:id/edit" component={EditFormTemplatePage} />
            <Route component={NotFoundPage} />
          </Switch>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;