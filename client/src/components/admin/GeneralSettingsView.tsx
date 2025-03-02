import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { SeasonalScopeSettings } from "./SeasonalScopeSettings";
import { StyleSettingsView } from "./StyleSettingsView";

export function GeneralSettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">General Settings</h2>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Scope</TabsTrigger>
          <TabsTrigger value="styling">UI Styling</TabsTrigger>
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

        <TabsContent value="seasonal">
          <SeasonalScopeSettings />
        </TabsContent>

        <TabsContent value="styling">
          <StyleSettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}