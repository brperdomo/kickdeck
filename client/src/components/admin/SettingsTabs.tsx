import { EmailTemplatesView } from "../../components/admin/EmailTemplatesView";

export function GeneralSettingsView() {
  return (
    <div className="space-y-10">
      <OrganizationSettingsForm />

      <div className="border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Email Templates</h3>
        <EmailTemplatesView isEmbedded={true} />
      </div>
    </div>
  );
}