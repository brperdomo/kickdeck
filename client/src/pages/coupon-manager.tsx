import { useParams } from "wouter";
import { AdminPageLayout } from "@/components/layouts/AdminPageLayout";
import { Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CouponManagement } from "@/components/admin/CouponManagement";

export default function CouponManagerPage() {
  const params = useParams();
  const eventId = params.id;

  return (
    <AdminPageLayout 
      title="Coupon Management" 
      subtitle="Configure Discount Codes"
      icon={<Ticket className="h-5 w-5 text-indigo-300" />}
      backUrl={`/admin/events/${eventId}/edit`}
      backLabel="Back to Event"
    >
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="p-6">
          <CouponManagement />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}