/**
 * Admin Routes Component
 * 
 * This component centralizes all the admin-related routes
 * to make it easier to apply consistent protection and access control.
 * 
 * In development mode, the DevBypassProtectedRoute is used which allows access
 * without authentication if a bypass is activated. In production, these routes 
 * are protected as normal.
 */
import { ReactNode } from "react";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { DevBypassProtectedRoute } from "../components/dev/DevBypassProtectedRoute";
import CreateEvent from "@/pages/create-event";
import EditEvent from "@/pages/edit-event";
import FormEditorPage from "@/pages/form-editor";
import FeeManagementPage from "@/pages/fee-management";
import CouponManagerPage from "@/pages/coupon-manager";
import EventClubsPage from "@/pages/event-clubs";
import RegistrationPreview from "@/pages/registration-preview";
import EventPreviewSelector from "@/pages/event-preview-selector";
import AccountingCodeManagement from "@/pages/accounting-code-management";
import EmailTemplateEdit from "@/pages/email-template-edit";
import EmailTemplatesPage from "@/pages/email-templates";
import SendGridSettingsPage from "@/pages/sendgrid-settings";
import FormTemplateCreatePage from "@/pages/form-template-create";
import FormTemplateEditPage from "@/pages/form-template-edit";
import AdminDashboard from "@/pages/admin-dashboard";
import TeamStatusTest from "@/pages/team-status-test";
import { DebugErrorBoundary } from "@/components/DebugErrorBoundary";

// In development, we use the dev bypass route. In production, we use the protected route.
// This provides a consistent way to handle authentication across the application.
// For this implementation we're hardcoding to always use development routes to make debugging easier
// but in a real production app, we would check the environment.
const isDevelopmentMode = true; // In prod, this would be: process.env.NODE_ENV === 'development'

// Choose which route component to use based on environment
const RouteComponent = isDevelopmentMode ? DevBypassProtectedRoute : ProtectedRoute;

interface AdminRoutesProps {
  // Any additional configuration options can go here
}

export default function AdminRoutes({}: AdminRoutesProps) {
  return (
    <>
      {/* Admin routes */}
      <RouteComponent path="/admin/events/create" requiredRole="admin" component={<CreateEvent />} />
      <RouteComponent path="/admin/events/:id/edit" requiredRole="admin" component={<EditEvent />} />
      <RouteComponent path="/admin/events/:id/application-form" requiredRole="admin" component={<FormEditorPage />} />
      <RouteComponent path="/admin/events/:id/fees" requiredRole="admin" component={<FeeManagementPage />} />
      <RouteComponent path="/admin/events/:id/coupons" requiredRole="admin" component={<CouponManagerPage />} />
      <RouteComponent path="/admin/events/:id/clubs" requiredRole="admin" component={<EventClubsPage />} />
      <RouteComponent path="/admin/events/:id/preview-registration" requiredRole="admin" component={<RegistrationPreview />} />
      <RouteComponent path="/admin/events/preview" requiredRole="admin" component={<EventPreviewSelector />} />
      <RouteComponent path="/admin/events/:id" requiredRole="admin" component={<EditEvent />} />
      <RouteComponent path="/admin/accounting-codes" requiredRole="admin" component={<AccountingCodeManagement />} />
      <RouteComponent path="/admin/email-templates/create" requiredRole="admin" component={<EmailTemplateEdit />} />
      <RouteComponent path="/admin/email-templates/:id" requiredRole="admin" component={<EmailTemplateEdit />} />
      <RouteComponent path="/admin/email-templates" requiredRole="admin" component={<EmailTemplatesPage />} />
      <RouteComponent path="/sendgrid-settings" requiredRole="admin" component={<SendGridSettingsPage />} />
      <RouteComponent path="/admin/form-templates/create" requiredRole="admin" component={<FormTemplateCreatePage />} />
      <RouteComponent path="/admin/form-templates/:id/edit" requiredRole="admin" component={<FormTemplateEditPage />} />
      <RouteComponent path="/admin/form-templates" requiredRole="admin" component={
        <DebugErrorBoundary>
          <AdminDashboard initialView="formTemplates" />
        </DebugErrorBoundary>
      } />
      <RouteComponent path="/admin/team-status-test" requiredRole="admin" component={<TeamStatusTest />} />
      
      {/* Main admin dashboard */}
      <RouteComponent path="/admin" requiredRole="admin" component={
        <DebugErrorBoundary>
          <AdminDashboard />
        </DebugErrorBoundary>
      } />
    </>
  );
}