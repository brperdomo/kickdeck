import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import React, { lazy, Suspense, useEffect } from 'react';
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { RouteDebugger } from "@/components/RouteDebugger";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AuthLoggedOut from "@/pages/auth-logged-out";
import AdminDashboard from "@/pages/admin-dashboard";
import PlatformFeeReportsStandalone from "@/pages/platform-fee-reports-standalone";
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
import ProductUpdatesPage from "@/pages/product-updates";
import { useUser } from "@/hooks/use-user";
import EventRegistration from "./pages/event-registration";
import EventDetailsPreview from "./pages/event-details-preview";
import MainLayout from "@/components/layouts/MainLayout";
import { FeeManagement } from "@/components/events/FeeManagement";
import FeeManagementPage from "@/pages/fee-management";
import FormEditorPage from "@/pages/form-editor";
import CouponManagerPage from "@/pages/coupon-manager";
import EventClubsPage from "@/pages/event-clubs";
import Newsletter from "@/pages/newsletter";
import RegistrationOrdersReport from "@/pages/registration-orders-report";
import PaymentLogs from "@/pages/payment-logs";
import FinancialOverviewReport from "@/pages/financial-overview-report";
import EventFinancialReport from "@/pages/event-financial-report";
import EventRegistrationReport from "@/pages/event-registration-report";
import FeesAnalysisReport from "@/pages/fees-analysis-report";
import BookkeepingReport from "@/pages/bookkeeping-report";
import RevenueForecast from "@/pages/revenue-forecast";
import Checkout from "@/pages/checkout";
import PaymentConfirmation from "@/pages/payment-confirmation";
import PaymentSetupConfirmation from "@/pages/payment-setup-confirmation";
import CompletePayment from "@/pages/CompletePayment";
import PaymentRecoveryDashboard from "@/pages/PaymentRecoveryDashboard";
import SendGridSettingsPage from "@/pages/sendgrid-settings";
import AdminSendGridSetup from "@/pages/admin-sendgrid-setup";
import { AuthProvider } from "@/hooks/use-auth";
// Account page import
import AccountPage from "./pages/account";
import { LogoutHandler } from "@/components/LogoutHandler";
// Emergency fix for registration
import EmergencyRegistrationFix from "@/pages/emergency-registration-fix";
// Safe eligibility demo
import SafeEligibilityDemo from "@/pages/SafeEligibilityDemo";
// Member roster upload
import MemberRosterUpload from "@/pages/member-roster-upload";
// Member dashboard
import MemberDashboard from "@/pages/member-dashboard";
// Complex locations map
import ComplexLocationsMapPage from "@/pages/complex-locations-map";

// Member merge interface - lazy loaded for admin use
const MemberMergeInterface = lazy(() => import("@/components/admin/MemberMergeInterface").then(m => ({ default: m.default })));

// Import landing page components
import LandingPage from "@/pages/landing-page";
import { isMainDomain } from "@/lib/domainHelper";

// Import fully implemented components for preview mode
import EventPreviewSelector from '@/pages/event-preview-selector';
import RegistrationPreview from '@/pages/registration-preview';

function Router() {
  const { user, isLoading } = useUser();
  // Check if we're on the main domain (matchpro.ai)
  const showLandingPage = isMainDomain();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show landing page if we're on the main domain
  if (showLandingPage) {
    return (
      <Switch>
        {/* Routes for the landing page */}
        <Route path="/auth">
          {() => {
            // Check if this is a logout scenario
            const urlParams = new URLSearchParams(window.location.search);
            const hasLoggedOut = urlParams.get('logged_out') === 'true';

            if (hasLoggedOut) {
              // Store the logout message in session storage so AuthPage can display it
              console.log('Setting logout message in sessionStorage (landing page)');
              sessionStorage.setItem('logout_message', 'You have been successfully logged out');

              // Remove the logged_out=true param from the URL to prevent any issues
              try {
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('logged_out');
                window.history.replaceState({}, '', newUrl.toString());
              } catch (e) {
                console.error('Failed to clean URL:', e);
              }
            }

            // Always render the auth page - it will show the logout message if present
            return <AuthPage />;
          }}
        </Route>
        <Route path="/auth-logged-out" component={AuthLoggedOut} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/product-updates" component={ProductUpdatesPage} />
        <Route path="/newsletter" component={Newsletter} />

        {/* Main landing page for the root path */}
        <Route path="/">
          <LandingPage />
        </Route>

        {/* Fallback for any other paths on the main domain */}
        <Route>
          <LandingPage />
        </Route>
      </Switch>
    );
  }

  // For all other domains, show the application routes
  // Logout route - available to all users
  return (
    <Switch>
      {/* Dedicated logout route that will forcibly clear all app state */}
      <Route path="/logout" component={LogoutHandler} />

      {/* Public routes that don't require authentication */}
      
      {/* Event registration routes - now using the EventDetailsPreview component first */}
      <Route path="/register/event/:eventId">
        {(params) => <EventDetailsPreview />}
      </Route>
      <Route path="/event/:eventId/register">
        {(params) => <EventDetailsPreview />}
      </Route>
      
      {/* Actual registration form with allowUnauthenticated=true by default */}
      <Route path="/register/event/:eventId/form">
        {(params) => {
          console.log("AUTH FIX: Rendering registration form with allowUnauthenticated=true");
          return <EventRegistration />;
        }}
      </Route>
      
      {/* Emergency fix for registration issues */}
      <Route path="/register/fix">
        <EmergencyRegistrationFix />
      </Route>
      
      {/* Payment completion route for teams with incomplete setup */}
      <Route path="/complete-payment" component={CompletePayment} />
      
      {/* Handle other routes based on auth status */}
      {!user ? (
        <>
          {/* Create a separate route for auth-logged-out to handle the redirect */}
          <Route path="/auth-logged-out" component={AuthLoggedOut} />

          {/* Regular auth route */}
          <Route path="/auth">
            {() => {
              // This is a custom component to help debug the issue
              // Check URL params directly here to handle different states
              const urlParams = new URLSearchParams(window.location.search);
              const hasLoggedOut = urlParams.get('logged_out') === 'true';

              console.log('Auth route accessed - params:', {
                hasLoggedOut,
                searchParams: window.location.search,
                urlParams: Object.fromEntries(urlParams.entries())
              });

              // If this is the logout URL, set the message and render AuthPage directly
              if (hasLoggedOut) {
                // Store the logout message in session storage so AuthPage can display it
                console.log('Setting logout message in sessionStorage');
                sessionStorage.setItem('logout_message', 'You have been successfully logged out');

                // Remove the logged_out=true param from the URL to prevent redirect loops
                // We'll replace the URL without page reload
                try {
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.delete('logged_out');
                  window.history.replaceState({}, '', newUrl.toString());
                } catch (e) {
                  console.error('Failed to clean URL:', e);
                }

                // Directly render the auth page which will show the message from session storage
                return <AuthPage />;
              }

              // Special case: If the user is already authenticated, we might need to handle redirect
              if (user) {
                console.log('Auth route: User already authenticated, letting AuthPage component handle redirect');

                // Let the AuthPage component handle the redirect logic based on sessionStorage
                // This will be picked up by the useEffect in AuthPage that checks for redirectAfterAuth
                return <AuthPage />;
              }

              // Otherwise render the normal login page
              return <AuthPage />;
            }}
          </Route>
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/newsletter" component={Newsletter} />
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
          <Route path="/admin/events/:id/clubs">
            {(params) => user.isAdmin ? <EventClubsPage /> : <NotFound />}
          </Route>
          <Route path="/admin/complex-locations">
            {user.isAdmin ? <ComplexLocationsMapPage /> : <NotFound />}
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
          <Route path="/sendgrid-settings">
            {user.isAdmin ? <SendGridSettingsPage /> : <NotFound />}
          </Route>
          <Route path="/admin/sendgrid-setup">
            {user.isAdmin ? <AdminSendGridSetup /> : <NotFound />}
          </Route>
          <Route path="/admin/form-templates/create">
            {user.isAdmin ? <FormTemplateCreatePage /> : <NotFound />}
          </Route>
          <Route path="/admin/form-templates/:id/edit">
            {user.isAdmin ? <FormTemplateEditPage /> : <NotFound />}
          </Route>
          <Route path="/admin/form-templates">
            {user.isAdmin ? <AdminDashboard initialView="formTemplates" /> : <NotFound />}
          </Route>
          <Route path="/admin/team-status-test">
            {user.isAdmin ? <TeamStatusTest /> : <NotFound />}
          </Route>
          <Route path="/admin/file-manager">
            {user.isAdmin ? <AdminDashboard initialView="files" /> : <NotFound />}
          </Route>
          <Route path="/admin/events">
            {user.isAdmin ? <AdminDashboard initialView="events" /> : <NotFound />}
          </Route>
          <Route path="/admin/teams">
            {user.isAdmin ? <AdminDashboard initialView="teams" /> : <NotFound />}
          </Route>
          <Route path="/admin/administrators">
            {user.isAdmin ? <AdminDashboard initialView="administrators" /> : <NotFound />}
          </Route>
          <Route path="/admin/complexes">
            {user.isAdmin ? <AdminDashboard initialView="complexes" /> : <NotFound />}
          </Route>
          <Route path="/admin/households">
            {user.isAdmin ? <AdminDashboard initialView="households" /> : <NotFound />}
          </Route>
          <Route path="/admin/scheduling">
            {user.isAdmin ? <AdminDashboard initialView="scheduling" /> : <NotFound />}
          </Route>
          <Route path="/admin/reports">
            {user.isAdmin ? <AdminDashboard initialView="reports" /> : <NotFound />}
          </Route>
          <Route path="/admin/members">
            {user.isAdmin ? <AdminDashboard initialView="members" /> : <NotFound />}
          </Route>
          <Route path="/admin/member-merge">
            {user.isAdmin ? (
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>}>
                <MemberMergeInterface />
              </Suspense>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/roles">
            {user.isAdmin ? <AdminDashboard initialView="roles" /> : <NotFound />}
          </Route>
          <Route path="/admin/account">
            {user.isAdmin ? <AdminDashboard initialView="account" /> : <NotFound />}
          </Route>
          <Route path="/admin/settings">
            {user.isAdmin ? <AdminDashboard initialView="settings" /> : <NotFound />}
          </Route>
          <Route path="/admin/payment-recovery">
            {user.isAdmin ? <PaymentRecoveryDashboard /> : <NotFound />}
          </Route>
          {/* We'll enhance the main dashboard with animations directly */}
          <Route path="/admin">
            {user.isAdmin ? <AdminDashboard initialView="events" /> : <NotFound />}
          </Route>
          <Route path="/platform-fee-reports">
            {user.isAdmin ? <PlatformFeeReportsStandalone /> : <NotFound />}
          </Route>

          {/* User routes */}
          <Route path="/household" component={HouseholdPage} />
          <Route path="/dashboard/my-household" component={HouseholdPage} />
          <Route path="/dashboard/member-roster" component={MemberDashboard} />
          <Route path="/dashboard/my-account">
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>}>
              {React.createElement(lazy(() => import('./pages/my-account')))}
            </Suspense>
          </Route>
          <Route path="/dashboard/account-settings">
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>}>
              {React.createElement(lazy(() => import('./pages/account-settings')))}
            </Suspense>
          </Route>
          <Route path="/dashboard/registrations">
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>}>
              {React.createElement(lazy(() => import('./pages/registrations')))}
            </Suspense>
          </Route>
          <Route path="/chat" component={ChatPage} />
          
          <Route path="/member-roster-upload" component={MemberRosterUpload} />

          <Route path="/product-updates">
            {user.isAdmin ? <ProductUpdatesPage /> : <NotFound />}
          </Route>
          <Route path="/registration-orders-report">
            {user.isAdmin ? <RegistrationOrdersReport /> : <NotFound />}
          </Route>
          <Route path="/payment-logs">
            {user.isAdmin ? <PaymentLogs /> : <NotFound />}
          </Route>
          <Route path="/financial-overview-report">
            {user.isAdmin ? <FinancialOverviewReport /> : <NotFound />}
          </Route>
          <Route path="/event-financial-report/:eventId">
            {(params) => user.isAdmin ? <EventFinancialReport eventId={params.eventId} /> : <NotFound />}
          </Route>
          <Route path="/event-registration-report/:eventId">
            {(params) => user.isAdmin ? <EventRegistrationReport eventId={params.eventId} /> : <NotFound />}
          </Route>
          <Route path="/fees-analysis-report">
            {user.isAdmin ? <FeesAnalysisReport /> : <NotFound />}
          </Route>
          <Route path="/bookkeeping-report">
            {user.isAdmin ? <BookkeepingReport /> : <NotFound />}
          </Route>
          <Route path="/revenue-forecast">
            {user.isAdmin ? <RevenueForecast /> : <NotFound />}
          </Route>
          <Route path="/checkout">
            <Checkout />
          </Route>
          <Route path="/payment-confirmation">
            <PaymentConfirmation />
          </Route>
          <Route path="/payment-setup-confirmation">
            <PaymentSetupConfirmation />
          </Route>
          <Route path="/dashboard" component={UserDashboard} />

          {/* Preview routes */}

          {/* Home route */}
          <Route path="/">
            {() => {
              // If there's an in-progress registration, redirect back to it
              const inRegistrationProcess = sessionStorage.getItem('in_registration_process') === 'true';
              const redirectAfterAuth = sessionStorage.getItem('redirectAfterAuth');
              
              if (inRegistrationProcess && redirectAfterAuth) {
                console.log('Detected in-progress registration. Redirecting to:', redirectAfterAuth);
                
                // Clean up the session storage variables
                sessionStorage.removeItem('in_registration_process');
                sessionStorage.removeItem('redirectAfterAuth');
                
                // Using a small timeout to ensure React state updates properly
                setTimeout(() => {
                  window.location.href = redirectAfterAuth;
                }, 100);
                
                // Return loading indicator while redirecting
                return (
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Returning to registration process...</p>
                      <p className="text-sm text-muted-foreground mt-2">One moment please</p>
                    </div>
                  </div>
                );
              }
              
              // Otherwise show the regular dashboard
              return user.isAdmin ? <AdminDashboard initialView="events" /> : <UserDashboard />;
            }}
          </Route>

          {/* 404 route */}
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  // Set up cross-tab logout communication
  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;

    try {
      // Create a broadcast channel for multi-tab/window communication
      broadcastChannel = new BroadcastChannel('app-logout');

      // Handler for logout messages
      const handleLogoutMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'LOGOUT') {
          console.log('Received logout event from another tab/window');
          
          // Check if we're already in a logout process
          const logoutInProgress = sessionStorage.getItem('logout_in_progress');
          if (logoutInProgress) {
            console.log('Logout already in progress, not initiating another one');
            return;
          }
          
          // Mark that we're starting a logout
          sessionStorage.setItem('logout_in_progress', 'true');
          sessionStorage.setItem('logout_initiated_at', Date.now().toString());

          // Force route to our dedicated logout handler
          window.location.href = '/logout';
        }
      };

      // Listen for logout messages
      broadcastChannel.addEventListener('message', handleLogoutMessage);

      // Clean up when component unmounts
      return () => {
        broadcastChannel?.removeEventListener('message', handleLogoutMessage);
        broadcastChannel?.close();
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported in this browser', err);
      // No cleanup needed if channel creation failed
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <MainLayout>
            <RouteDebugger />
            <Router />
            <Toaster />
          </MainLayout>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;