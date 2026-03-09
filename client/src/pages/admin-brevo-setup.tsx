import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { BrevoSetupWizard } from '@/components/admin/BrevoSetupWizard';

export default function AdminBrevoSetup() {
  return (
    <AdminPageWrapper
      title="Email Configuration"
      subtitle="Configure Brevo for email delivery across your application"
      backUrl="/admin"
      backLabel="Back to Admin Dashboard"
    >
      <BrevoSetupWizard />
    </AdminPageWrapper>
  );
}
