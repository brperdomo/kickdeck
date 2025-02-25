import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsView({ activeSettingsView }: { activeSettingsView: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>{activeSettingsView.charAt(0).toUpperCase() + activeSettingsView.slice(1)} Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Settings configuration coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
