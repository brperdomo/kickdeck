import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { SeasonalScopeSettings } from "./SeasonalScopeSettings";

export function GeneralSettingsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">General Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm />
        </CardContent>
      </Card>

      <div className="pt-6">
        <SeasonalScopeSettings />
      </div>
    </div>
  );
}