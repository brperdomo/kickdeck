import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminBanner } from "@/components/admin/AdminBanner";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BrevoTemplate {
  id: number;
  name: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  isActive: boolean;
  brevoTemplateId: number | null;
}

export default function BrevoSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  // Fetch Brevo settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["brevo-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/brevo/settings", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch Brevo settings");
      return response.json();
    },
  });

  // Fetch Brevo templates
  const { data: brevoTemplates, isLoading: isLoadingTemplates, refetch: refetchTemplates, error: templatesError } = useQuery({
    queryKey: ["brevo-templates"],
    queryFn: async () => {
      const response = await fetch("/api/admin/brevo/templates", {
        credentials: 'include'
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Please log in as an admin.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch Brevo templates`);
      }

      return response.json();
    },
    retry: false, // Don't retry auth failures
  });

  // Fetch Email Templates with mappings
  const { data: emailTemplates, isLoading: isLoadingEmailTemplates } = useQuery({
    queryKey: ["email-templates-with-mappings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/brevo/template-mappings", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch email template mappings");
      return response.json();
    },
  });

  // Map template mutation
  const mapTemplateMutation = useMutation({
    mutationFn: async ({ templateType, brevoTemplateId }: { templateType: string; brevoTemplateId: number | null }) => {
      const response = await fetch("/api/admin/brevo/template-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ templateType, brevoTemplateId }),
      });
      if (!response.ok) throw new Error("Failed to update template mapping");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template mapping updated",
        description: "The Brevo template has been successfully mapped to the email type.",
      });
      queryClient.invalidateQueries({ queryKey: ["email-templates-with-mappings"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update template mapping",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test template mutation
  const testTemplateMutation = useMutation({
    mutationFn: async ({ templateId, recipientEmail }: { templateId: string; recipientEmail: string }) => {
      const response = await fetch("/api/admin/brevo/test-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          templateId: Number(templateId),
          recipientEmail,
          testData: {
            firstName: "Test",
            lastName: "User",
            email: recipientEmail,
            loginLink: window.location.origin + "/login",
            role: "Test User",
          },
        }),
      });
      if (!response.ok) throw new Error("Failed to send test email");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: `A test email has been sent to ${testEmail}`,
      });
      setIsTestDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to get template name by ID
  const getTemplateNameById = (id: number) => {
    if (!brevoTemplates) return "Unknown Template";
    const template = brevoTemplates.find((t: BrevoTemplate) => t.id === id);
    return template ? template.name : "Unknown Template";
  };

  // Handle mapping a template
  const handleMapTemplate = (templateType: string, brevoTemplateId: string | null) => {
    // Convert "none" to null for API calls
    const templateId = brevoTemplateId === "none" || brevoTemplateId === null ? null : Number(brevoTemplateId);
    mapTemplateMutation.mutate({ templateType, brevoTemplateId: templateId });
  };

  // Handle sending a test email
  const handleSendTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplateId) {
      toast({
        title: "Template required",
        description: "Please select a template to test",
        variant: "destructive",
      });
      return;
    }

    testTemplateMutation.mutate({
      templateId: selectedTemplateId,
      recipientEmail: testEmail,
    });
  };

  const isLoading = isLoadingSettings || isLoadingTemplates || isLoadingEmailTemplates;

  return (
    <>
      <AdminBanner />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/admin/email-templates">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Email Templates
            </Button>
          </Link>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Brevo Settings</h1>
          <Button
            variant="outline"
            onClick={() => refetchTemplates()}
            disabled={isLoadingTemplates}
          >
            {isLoadingTemplates ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Templates
          </Button>
        </div>

        <Tabs defaultValue="templates">
          <TabsList className="mb-6">
            <TabsTrigger value="templates">Template Mappings</TabsTrigger>
            <TabsTrigger value="settings">Brevo Connection</TabsTrigger>
            <TabsTrigger value="test">Test Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Brevo Template Mappings</CardTitle>
                <CardDescription>
                  Map your email types to Brevo templates. This allows you to use Brevo's visual editor to design your email templates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Error loading Brevo templates</p>
                        <p className="text-sm mt-1">{templatesError.message}</p>
                        {templatesError.message.includes('Authentication') && (
                          <p className="text-sm mt-2">
                            Please ensure you're logged in as an administrator to access Brevo settings.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isLoadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : templatesError ? (
                  <div className="text-center py-8">
                    <Button
                      variant="outline"
                      onClick={() => refetchTemplates()}
                      className="mt-4"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                ) : !brevoTemplates || brevoTemplates.length === 0 ? (
                  <div className="bg-muted p-4 rounded-md text-center">
                    <p className="text-muted-foreground">No Brevo templates found. Please create templates in your Brevo account first.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {emailTemplates?.map((template: EmailTemplate) => (
                      <div key={template.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-lg">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">Type: {template.type}</p>
                          </div>
                          <div>
                            {template.brevoTemplateId ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Mapped
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                Not Mapped
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <Label htmlFor={`template-${template.id}`} className="mb-2 block">
                              Brevo Template
                            </Label>
                            <Select
                              value={template.brevoTemplateId ? String(template.brevoTemplateId) : "none"}
                              onValueChange={(value) => handleMapTemplate(template.type, value)}
                            >
                              <SelectTrigger id={`template-${template.id}`}>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None (Use HTML template)</SelectItem>
                                {brevoTemplates.map((brevoTemplate: BrevoTemplate) => (
                                  <SelectItem key={brevoTemplate.id} value={String(brevoTemplate.id)}>
                                    {brevoTemplate.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {template.brevoTemplateId && (
                            <Button
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleMapTemplate(template.type, null)}
                            >
                              Remove Mapping
                            </Button>
                          )}
                        </div>

                        {template.brevoTemplateId && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            Currently mapped to: {getTemplateNameById(template.brevoTemplateId)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Brevo Connection Settings</CardTitle>
                <CardDescription>
                  View your Brevo connection settings. The API key is managed through environment variables for security.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !settings?.provider ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-muted-foreground">No Brevo provider configured. Please run the setup first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1 block">Provider Name</Label>
                      <div className="p-2 border rounded">{settings.provider.name}</div>
                    </div>
                    <div>
                      <Label className="mb-1 block">Default Provider</Label>
                      <div className="p-2 border rounded">{settings.provider.isDefault ? "Yes" : "No"}</div>
                    </div>
                    <div>
                      <Label className="mb-1 block">API Key Status</Label>
                      <div className="p-2 border rounded flex items-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Configured
                        </Badge>
                        <span className="ml-2 text-sm text-muted-foreground">(Managed via environment variables)</span>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 block">Mapped Templates</Label>
                      <div className="p-2 border rounded">
                        {settings.templatesWithBrevo?.length || 0} template(s) mapped to Brevo
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Need to update your API key? Set the BREVO_API_KEY environment variable.
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Test Brevo Templates</CardTitle>
                <CardDescription>
                  Send a test email using a Brevo template to verify it works correctly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !brevoTemplates || brevoTemplates.length === 0 ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-muted-foreground">No Brevo templates found. Please create templates in your Brevo account first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="test-template" className="mb-2 block">
                        Select Template to Test
                      </Label>
                      <Select
                        value={selectedTemplateId}
                        onValueChange={setSelectedTemplateId}
                      >
                        <SelectTrigger id="test-template">
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {brevoTemplates.map((template: BrevoTemplate) => (
                            <SelectItem key={template.id} value={String(template.id)}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="test-email" className="mb-2 block">
                        Recipient Email
                      </Label>
                      <Input
                        id="test-email"
                        type="email"
                        placeholder="Enter recipient email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleSendTestEmail}
                      disabled={!selectedTemplateId || !testEmail || testTemplateMutation.isPending}
                      className="mt-4"
                    >
                      {testTemplateMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send Test Email
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground">
                  Test emails will include sample data like name, login link, etc.
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-8" />

        <div className="text-sm text-muted-foreground">
          <h3 className="font-medium mb-2">About Brevo Templates</h3>
          <p>
            Brevo templates allow you to design visually rich, responsive emails using Brevo's
            template editor. By mapping these templates to your application's email types, you can manage
            designs in Brevo while your application handles when and to whom emails are sent.
          </p>
          <p className="mt-2">
            For detailed instructions on setting up and managing Brevo templates, please refer to the
            {" "}
            <a href="https://developers.brevo.com/docs/send-a-transactional-email" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Brevo documentation
            </a>.
          </p>
        </div>
      </div>
    </>
  );
}
