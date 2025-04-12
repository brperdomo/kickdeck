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
import ResetPassword from "@/pages/reset-password";
import AdminDashboard from "@/pages/admin-dashboard";
import CreateEvent from "@/pages/create-event";
import CouponManagement from "@/pages/coupon-management";
import AccountingCodeManagement from "@/pages/accounting-code-management";
import UserDashboard from "@/pages/user-dashboard";
import HouseholdPage from "@/pages/household";
import ChatPage from "@/pages/chat";
import EditEvent from "@/pages/edit-event";
import EventApplicationForm from "@/pages/event-application-form";
import EmailTemplatesPage from "@/pages/email-templates";
import EmailTemplateEdit from "@/pages/email-template-edit";
import TeamStatusTest from "@/pages/team-status-test";
import FormTemplatesPage from "@/pages/form-templates";
import FormTemplateCreatePage from "@/pages/form-template-create";
import FormTemplateEditPage from "@/pages/form-template-edit";
import { useUser } from "@/hooks/use-user";
import EventRegistration from "./pages/event-registration";
import MainLayout from "@/components/layouts/MainLayout";
import { FeeManagement } from "@/components/events/FeeManagement";
import FeeManagementPage from "@/pages/fee-management";
import FormEditorPage from "@/pages/form-editor";
import CouponManagerPage from "@/pages/coupon-manager";
import { AuthProvider } from "@/hooks/use-auth";
import { LogoutHandler } from "@/components/LogoutHandler";
import { FloatingEmulationButton } from "@/components/admin/FloatingEmulationButton";

// Import fully implemented components for preview mode
import EventPreviewSelector from '@/pages/event-preview-selector';
import RegistrationPreview from '@/pages/registration-preview';

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Logout route - available to all users
  return (
    <Switch>
      {/* Dedicated logout route that will forcibly clear all app state */}
      <Route path="/logout" component={LogoutHandler} />
      
      {/* Public routes that don't require authentication */}
      {!user ? (
        <>
          <Route path="/auth" component={AuthPage} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/register/event/:eventId">
            {(params) => <EventRegistration eventIdOverride={params.eventId} />}
          </Route>
          <Route path="/dashboard">
            <AuthPage />
          </Route>
          {/* Redirect all other routes to auth page */}
          <Route>
            <AuthPage />
          </Route>
        </>
      ) : (
        // Protected routes for authenticated users
        <>
          {/* Admin routes */}
          <Route path="/admin/events/create">
            {user.isAdmin ? <CreateEvent /> : <NotFound />}
          </Route>
          {/* Admin routes */}
          <Route path="/admin/events/:id/edit">
            {user.isAdmin ? <EditEvent /> : <NotFound />}
          </Route>
          <Route path="/admin/events/:id/application-form">
            {(params) => user.isAdmin ? <FormEditorPage /> : <NotFound />}
          </Route>
          <Route path="/admin/events/:id/fees">
            {(params) => user.isAdmin ? <FeeManagementPage /> : <NotFound />}
          </Route>
          <Route path="/admin/events/:id/coupons">
            {(params) => user.isAdmin ? <CouponManagerPage /> : <NotFound />}
          </Route>
          <Route path="/admin/events/:id/preview-registration">
            {user.isAdmin ? <RegistrationPreview /> : <NotFound />}
          </Route>
          <Route path="/admin/events/preview">
            {user.isAdmin ? <EventPreviewSelector /> : <NotFound />}
          </Route>
          <Route path="/admin/events/:id">
            {user.isAdmin ? <EditEvent /> : <NotFound />}
          </Route>
          <Route path="/admin/accounting-codes">
            {user.isAdmin ? <AccountingCodeManagement /> : <NotFound />}
          </Route>
          <Route path="/admin/email-templates/create">
            {user.isAdmin ? <EmailTemplateEdit /> : <NotFound />}
          </Route>
          <Route path="/admin/email-templates/:id">
            {user.isAdmin ? <EmailTemplateEdit /> : <NotFound />}
          </Route>
          <Route path="/admin/email-templates">
            {user.isAdmin ? <EmailTemplatesPage /> : <NotFound />}
          </Route>
          <Route path="/admin/form-templates/create">
            {user.isAdmin ? <FormTemplateCreatePage /> : <NotFound />}
          </Route>
          <Route path="/admin/form-templates/:id/edit">
            {user.isAdmin ? <FormTemplateEditPage /> : <NotFound />}
          </Route>
          <Route path="/admin/form-templates">
            {user.isAdmin ? <FormTemplatesPage /> : <NotFound />}
          </Route>
          <Route path="/admin/team-status-test">
            {user.isAdmin ? <TeamStatusTest /> : <NotFound />}
          </Route>
          <Route path="/admin/events">
            {user.isAdmin ? <AdminDashboard /> : <NotFound />}
          </Route>
          {/* We'll enhance the main dashboard with animations directly */}
          <Route path="/admin">
            {user.isAdmin ? <AdminDashboard /> : <NotFound />}
          </Route>

          {/* User routes */}
          <Route path="/household" component={HouseholdPage} />
          <Route path="/chat" component={ChatPage} />
          <Route path="/register/event/:eventId">
            {(params) => <EventRegistration eventIdOverride={params.eventId} />}
          </Route>
          <Route path="/dashboard" component={UserDashboard} />

          {/* Preview routes */}

          {/* Home route */}
          <Route path="/">
            {user.isAdmin ? <AdminDashboard /> : <UserDashboard />}
          </Route>

          {/* 404 route */}
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <MainLayout>
            <Router />
            <FloatingEmulationButton />
            <Toaster />
          </MainLayout>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;