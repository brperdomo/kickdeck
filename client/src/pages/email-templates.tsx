import { EmailTemplatesView } from "@/components/admin/EmailTemplatesView";
import { AdminBanner } from "@/components/admin/AdminBanner";

export default function EmailTemplatesPage() {
  return (
    <>
      <AdminBanner />
      <div className="container mx-auto px-4 py-8">
        <EmailTemplatesView />
      </div>
    </>
  );
}
