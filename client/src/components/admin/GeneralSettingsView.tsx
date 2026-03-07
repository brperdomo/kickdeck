import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { SeasonalScopeSettings } from "./SeasonalScopeSettings";
import { StyleSettingsView } from "./StyleSettingsView";
import { EmailTemplatesView } from "./EmailTemplatesView";
import { EmailProviderSettings } from "./EmailProviderSettings";
import { StripeSettingsView } from "./StripeSettingsView";
import { AIConfigurationSettings } from "./AIConfigurationSettings";
import {
  Building2,
  Calendar,
  Palette,
  Mail,
  ServerCog,
  Brain
} from "lucide-react";

export function GeneralSettingsView() {
  return (
    <div className="space-y-6 settings-section app-settings">
      <h2 className="text-2xl font-bold">General Settings</h2>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="organization" className="w-full">
            <TabsList className="w-full border-b rounded-none justify-start bg-background">
              <TabsTrigger value="organization" className="flex items-center gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3">
                <Building2 className="h-4 w-4" />
                <span>Organization</span>
              </TabsTrigger>
              <TabsTrigger value="seasonal" className="flex items-center gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3">
                <Calendar className="h-4 w-4" />
                <span>Seasonal Scope</span>
              </TabsTrigger>
              <TabsTrigger value="styling" className="flex items-center gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3">
                <Palette className="h-4 w-4" />
                <span>UI Styling</span>
              </TabsTrigger>
              <TabsTrigger value="emailTemplates" className="flex items-center gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3">
                <Mail className="h-4 w-4" />
                <span>Email Templates</span>
              </TabsTrigger>
              <TabsTrigger value="emailProvider" className="flex items-center gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3">
                <ServerCog className="h-4 w-4" />
                <span>Email Provider</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3">
                <Brain className="h-4 w-4" />
                <span>AI</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="organization" className="m-0">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">Organization Details</h3>
                  <p className="text-muted-foreground text-sm">Manage your organization's profile information</p>
                </div>
                <OrganizationSettingsForm />
              </TabsContent>

              <TabsContent value="seasonal" className="m-0">
                <SeasonalScopeSettings />
              </TabsContent>

              <TabsContent value="styling" className="m-0">
                <StyleSettingsView />
              </TabsContent>

              <TabsContent value="emailTemplates" className="m-0">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">Email Templates</h3>
                  <p className="text-muted-foreground text-sm">Customize email templates sent to users</p>
                </div>
                <EmailTemplatesView isEmbedded={false} />
              </TabsContent>

              <TabsContent value="emailProvider" className="m-0">
                <EmailProviderSettings />
              </TabsContent>

              <TabsContent value="ai" className="m-0">
                <AIConfigurationSettings />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}