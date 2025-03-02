
import { useState } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { GeneralSettingsView } from "@/components/admin/GeneralSettingsView";
import { BrandingPreview } from "@/components/admin/BrandingPreview";
import { BrandingPreviewProvider } from "@/components/admin/BrandingPreviewContext";
import { OrganizationSettingsForm } from "@/components/admin/OrganizationSettingsForm";
import { ThemeEditor } from "@/components/admin/ThemeEditor";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="styling">Theme & Styling</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsView />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingPreviewProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <OrganizationSettingsForm />
              </div>
              <BrandingPreview />
            </div>
          </BrandingPreviewProvider>
        </TabsContent>

        <TabsContent value="styling">
          <ThemeEditor />
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Payment Gateway Settings</h3>
                <p className="text-muted-foreground">
                  Configure your payment gateway settings here. This will allow you to accept payments for event registrations, team fees, and other charges.
                </p>
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">Payment settings will be implemented in a future update.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
