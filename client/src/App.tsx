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
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DebugErrorBoundary } from "@/components/DebugErrorBoundary";
import { useAuth } from "@/hooks/use-auth";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AuthLoggedOut from "@/pages/auth-logged-out";
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
import ProductUpdatesPage from "@/pages/product-updates";
import EventRegistration from "./pages/event-registration";
import EventDetailsPreview from "./pages/event-details-preview";
import MainLayout from "@/components/layouts/MainLayout";
import { FeeManagement } from "@/components/events/FeeManagement";
import FeeManagementPage from "@/pages/fee-management";
import FormEditorPage from "@/pages/form-editor";
import CouponManagerPage from "@/pages/coupon-manager";
import EventClubsPage from "@/pages/event-clubs";
import RegistrationOrdersReport from "@/pages/registration-orders-report";
import FinancialOverviewReport from "@/pages/financial-overview-report";
import EventFinancialReport from "@/pages/event-financial-report";
import FeesAnalysisReport from "@/pages/fees-analysis-report";
import BookkeepingReport from "@/pages/bookkeeping-report";
import Checkout from "@/pages/checkout";
import PaymentConfirmation from "@/pages/payment-confirmation";
import PaymentSetupConfirmation from "@/pages/payment-setup-confirmation";
import SendGridSettingsPage from "@/pages/sendgrid-settings";
import { AuthProvider } from "@/hooks/use-auth";
// Account page import
import AccountPage from "./pages/account";
import { LogoutHandler } from "@/components/LogoutHandler";
// Emergency fix for registration
import EmergencyRegistrationFix from "@/pages/emergency-registration-fix";

// Import landing page components
import LandingPage from "@/pages/landing-page";
import { isMainDomain } from "@/lib/domainHelper";

// Import fully implemented components for preview mode
import EventPreviewSelector from '@/pages/event-preview-selector';
import RegistrationPreview from '@/pages/registration-preview';

function Router() {
  const { user, isLoading } = useAuth();
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
          {/* Redirect all other routes to auth page */}
          <Route>
            <AuthPage />
          </Route>
        </>
      ) : (
        // Protected routes for authenticated users
        <>
          {/* Add the RoleBasedRedirect component to handle role-based navigation */}
          <RoleBasedRedirect />
          
          {/* Admin routes */}
          <ProtectedRoute path="/admin/events/create" requiredRole="admin" component={<CreateEvent />} />
          {/* Admin routes - using ProtectedRoute for better protection */}
          <ProtectedRoute path="/admin/events/:id/edit" requiredRole="admin" component={<EditEvent />} />
          <ProtectedRoute path="/admin/events/:id/application-form" requiredRole="admin" component={<FormEditorPage />} />
          <ProtectedRoute path="/admin/events/:id/fees" requiredRole="admin" component={<FeeManagementPage />} />
          <ProtectedRoute path="/admin/events/:id/coupons" requiredRole="admin" component={<CouponManagerPage />} />
          <ProtectedRoute path="/admin/events/:id/clubs" requiredRole="admin" component={<EventClubsPage />} />
          <ProtectedRoute path="/admin/events/:id/preview-registration" requiredRole="admin" component={<RegistrationPreview />} />
          <ProtectedRoute path="/admin/events/preview" requiredRole="admin" component={<EventPreviewSelector />} />
          <ProtectedRoute path="/admin/events/:id" requiredRole="admin" component={<EditEvent />} />
          <ProtectedRoute path="/admin/accounting-codes" requiredRole="admin" component={<AccountingCodeManagement />} />
          <ProtectedRoute path="/admin/email-templates/create" requiredRole="admin" component={<EmailTemplateEdit />} />
          <ProtectedRoute path="/admin/email-templates/:id" requiredRole="admin" component={<EmailTemplateEdit />} />
          <ProtectedRoute path="/admin/email-templates" requiredRole="admin" component={<EmailTemplatesPage />} />
          <ProtectedRoute path="/sendgrid-settings" requiredRole="admin" component={<SendGridSettingsPage />} />
          <ProtectedRoute path="/admin/form-templates/create" requiredRole="admin" component={<FormTemplateCreatePage />} />
          <ProtectedRoute path="/admin/form-templates/:id/edit" requiredRole="admin" component={<FormTemplateEditPage />} />
          <ProtectedRoute path="/admin/form-templates" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="formTemplates" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/team-status-test" requiredRole="admin" component={<TeamStatusTest />} />
          <ProtectedRoute path="/admin/file-manager" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="files" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/events" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="events" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/teams" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="teams" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/administrators" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="administrators" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/complexes" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="complexes" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/households" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="households" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/scheduling" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="scheduling" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/reports" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="reports" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/members" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="members" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/roles" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="roles" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/account" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="account" />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/admin/settings" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard initialView="settings" />
            </DebugErrorBoundary>
          } />
          {/* We'll enhance the main dashboard with animations directly */}
          <ProtectedRoute path="/admin" requiredRole="admin" component={
            <DebugErrorBoundary>
              <AdminDashboard />
            </DebugErrorBoundary>
          } />
          
          {/* Add a direct route to handle edge cases for admin dashboard */}
          <Route path="/admin-direct">
            {() => (
              <DebugErrorBoundary>
                <AdminDashboard />
              </DebugErrorBoundary>
            )}
          </Route>
          
          {/* Emergency admin access route that bypasses role checks */}
          <Route path="/admin-emergency">
            {() => (
              <DebugErrorBoundary>
                <AdminDashboard />
              </DebugErrorBoundary>
            )}
          </Route>

          {/* User routes - using ProtectedRoute for member-specific routes */}
          <ProtectedRoute path="/household" requiredRole="member" component={
            <DebugErrorBoundary>
              <HouseholdPage />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute path="/dashboard/my-household" requiredRole="member" component={
            <DebugErrorBoundary>
              <HouseholdPage />
            </DebugErrorBoundary>
          } />
          <ProtectedRoute 
            path="/dashboard/my-account" 
            requiredRole="member" 
            component={
              <DebugErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>}>
                  {React.createElement(lazy(() => import('./pages/my-account')))}
                </Suspense>
              </DebugErrorBoundary>
            }
          />
          <ProtectedRoute 
            path="/dashboard/account-settings" 
            requiredRole="member" 
            component={
              <DebugErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>}>
                  {React.createElement(lazy(() => import('./pages/account-settings')))}
                </Suspense>
              </DebugErrorBoundary>
            }
          />
          <ProtectedRoute 
            path="/dashboard/registrations" 
            requiredRole="member" 
            component={
              <DebugErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>}>
                  {React.createElement(lazy(() => import('./pages/registrations')))}
                </Suspense>
              </DebugErrorBoundary>
            }
          />
          <ProtectedRoute path="/chat" requiredRole="member" component={<ChatPage />} />

          <ProtectedRoute path="/product-updates" requiredRole="admin" component={<ProductUpdatesPage />} />
          <ProtectedRoute path="/registration-orders-report" requiredRole="admin" component={<RegistrationOrdersReport />} />
          <ProtectedRoute path="/financial-overview-report" requiredRole="admin" component={<FinancialOverviewReport />} />
          <Route path="/event-financial-report/:eventId">
            {(params) => (
              <ProtectedRoute 
                path="/event-financial-report/:eventId" 
                requiredRole="admin" 
                component={<EventFinancialReport eventId={params.eventId} />} 
              />
            )}
          </Route>
          <ProtectedRoute path="/fees-analysis-report" requiredRole="admin" component={<FeesAnalysisReport />} />
          <ProtectedRoute path="/bookkeeping-report" requiredRole="admin" component={<BookkeepingReport />} />
          {/* Payment routes - not protected by role since they're accessed after authentication from different flows */}
          <Route path="/checkout" component={Checkout} />
          <Route path="/payment-confirmation" component={PaymentConfirmation} />
          <Route path="/payment-setup-confirmation" component={PaymentSetupConfirmation} />
          
          {/* Dashboard routes - protected with role-based redirection */}
          <ProtectedRoute path="/dashboard" requiredRole="member" component={
            <DebugErrorBoundary>
              <UserDashboard />
            </DebugErrorBoundary>
          } />
          
          {/* Add a direct route to handle edge cases */}
          <Route path="/dashboard-direct">
            {() => (
              <DebugErrorBoundary>
                <UserDashboard />
              </DebugErrorBoundary>
            )}
          </Route>
          
          {/* Emergency member dashboard access route that bypasses role checks */}
          <Route path="/dashboard-emergency">
            {() => (
              <DebugErrorBoundary>
                <UserDashboard />
              </DebugErrorBoundary>
            )}
          </Route>
          

          
          {/* Preview routes */}

          {/* Home route - handles registration process redirects and role-based routing */}
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
              
              // Use RoleBasedRedirect to properly handle routing based on user role
              return <RoleBasedRedirect />;
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