import { useParams } from "wouter";
import { AdminPageLayout } from "@/components/layouts/AdminPageLayout";
import { FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

// Import the main component content
import EventApplicationForm from "./event-application-form";

export default function FormEditorPage() {
  const params = useParams();
  const eventId = params.id;
  const [activeTab, setActiveTab] = useState("editor");

  // Define navigation items for the sidebar
  const navItems = [
    { id: "editor", label: "Form Editor" },
    { id: "preview", label: "Preview" },
    { id: "templates", label: "Templates" },
  ];

  return (
    <AdminPageLayout 
      title="Registration Form" 
      subtitle="Design Registration Forms"
      icon={<FileSpreadsheet className="h-5 w-5 text-indigo-300" />}
      backUrl={`/admin/events/${eventId}/edit`}
      backLabel="Back to Event"
      navItems={navItems}
      activeItem={activeTab}
      onNavItemClick={(id) => setActiveTab(id)}
    >
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="p-6">
          <EventApplicationForm />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}