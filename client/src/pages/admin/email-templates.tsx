
import React from "react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { EmailTemplateManagement } from "@/components/admin/EmailTemplateManagement";
import { Card, CardContent } from "@/components/ui/card";

export default function EmailTemplatesPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Email Templates</h1>
        <Card>
          <CardContent className="p-6">
            <EmailTemplateManagement />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
