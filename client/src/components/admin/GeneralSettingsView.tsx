
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { SeasonalScopeSettings } from "./SeasonalScopeSettings";
import { StyleSettingsView } from "./StyleSettingsView";
import { EmailTemplatesView } from "./EmailTemplatesView";
import { OrganizationsManagement } from "./OrganizationsManagement";
import { DashboardPreview } from "./DashboardPreview";

export function GeneralSettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">General Settings</h2>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="clients">Client Organizations</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Scope</TabsTrigger>
          <TabsTrigger value="styling">UI Styling</TabsTrigger>
          <TabsTrigger value="emailTemplates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clients">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrganizationsManagement />
            <div className="col-span-1">
              <DashboardPreview />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seasonal">
          <SeasonalScopeSettings />
        </TabsContent>

        <TabsContent value="styling">
          <StyleSettingsView />
        </TabsContent>

        <TabsContent value="emailTemplates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailTemplatesView isEmbedded={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
