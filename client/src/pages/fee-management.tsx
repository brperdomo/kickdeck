import { useParams } from "wouter";
import { AdminPageLayout } from "@/components/layouts/AdminPageLayout";
import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FeeManagement } from "@/components/events/FeeManagement";

export default function FeeManagementPage() {
  const params = useParams();
  const eventId = params.id;

  return (
    <AdminPageLayout 
      title="Fee Management" 
      subtitle="Configure Registration Fees"
      icon={<DollarSign className="h-5 w-5 text-indigo-300" />}
      backUrl={`/admin/events/${eventId}/edit`}
      backLabel="Back to Event"
    >
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="p-6">
          <FeeManagement />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}