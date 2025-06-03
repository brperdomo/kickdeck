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

interface SendGridTemplate {
  id: string;
  name: string;
  versions: {
    id: string;
    name: string;
    subject: string;
    active: number;
  }[];
}

interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  isActive: boolean;
  sendgridTemplateId: string | null;
}

export default function SendGridSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  // Fetch SendGrid settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["sendgrid-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/sendgrid/settings", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch SendGrid settings");
      return response.json();
    },
  });

  // Fetch SendGrid templates
  const { data: sendgridTemplates, isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ["sendgrid-templates"],
    queryFn: async () => {
      const response = await fetch("/api/admin/sendgrid/templates", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch SendGrid templates");
      return response.json();
    },
  });

  // Fetch Email Templates with mappings
  const { data: emailTemplates, isLoading: isLoadingEmailTemplates } = useQuery({
    queryKey: ["email-templates-with-mappings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/sendgrid/template-mappings", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch email template mappings");
      return response.json();
    },
  });

  // Map template mutation
  const mapTemplateMutation = useMutation({
    mutationFn: async ({ templateType, sendgridTemplateId }: { templateType: string; sendgridTemplateId: string | null }) => {
      const response = await fetch("/api/admin/sendgrid/template-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ templateType, sendgridTemplateId }),
      });
      if (!response.ok) throw new Error("Failed to update template mapping");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template mapping updated",
        description: "The SendGrid template has been successfully mapped to the email type.",
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
      const response = await fetch("/api/admin/sendgrid/test-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          templateId,
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
  const getTemplateNameById = (id: string) => {
    if (!sendgridTemplates) return "Unknown Template";
    const template = sendgridTemplates.find((t: SendGridTemplate) => t.id === id);
    return template ? template.name : "Unknown Template";
  };

  // Handle mapping a template
  const handleMapTemplate = (templateType: string, sendgridTemplateId: string | null) => {
    // Convert "none" to null for API calls
    const templateId = sendgridTemplateId === "none" ? null : sendgridTemplateId;
    mapTemplateMutation.mutate({ templateType, sendgridTemplateId: templateId });
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
          <h1 className="text-3xl font-bold">SendGrid Settings</h1>
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
            <TabsTrigger value="settings">SendGrid Connection</TabsTrigger>
            <TabsTrigger value="test">Test Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>SendGrid Template Mappings</CardTitle>
                <CardDescription>
                  Map your email types to SendGrid dynamic templates. This allows you to use SendGrid's visual editor to design your email templates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !sendgridTemplates || sendgridTemplates.length === 0 ? (
                  <div className="bg-muted p-4 rounded-md text-center">
                    <p className="text-muted-foreground">No SendGrid templates found. Please create templates in your SendGrid account first.</p>
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
                            {template.sendgridTemplateId ? (
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
                              SendGrid Template
                            </Label>
                            <Select
                              value={template.sendgridTemplateId || "none"}
                              onValueChange={(value) => handleMapTemplate(template.type, value)}
                            >
                              <SelectTrigger id={`template-${template.id}`}>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None (Use HTML template)</SelectItem>
                                {sendgridTemplates.map((sgTemplate: SendGridTemplate) => (
                                  <SelectItem key={sgTemplate.id} value={sgTemplate.id}>
                                    {sgTemplate.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {template.sendgridTemplateId && (
                            <Button
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleMapTemplate(template.type, null)}
                            >
                              Remove Mapping
                            </Button>
                          )}
                        </div>

                        {template.sendgridTemplateId && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            Currently mapped to: {getTemplateNameById(template.sendgridTemplateId)}
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
                <CardTitle>SendGrid Connection Settings</CardTitle>
                <CardDescription>
                  View your SendGrid connection settings. The API key is managed through environment variables for security.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !settings?.provider ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-muted-foreground">No SendGrid provider configured. Please run the setup script first.</p>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-sm">node setup-sendgrid-provider.js</pre>
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
                        {settings.templatesWithSendGrid?.length || 0} template(s) mapped to SendGrid
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Need to update your API key? Set the SENDGRID_API_KEY environment variable.
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Test SendGrid Templates</CardTitle>
                <CardDescription>
                  Send a test email using a SendGrid dynamic template to verify it works correctly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !sendgridTemplates || sendgridTemplates.length === 0 ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-muted-foreground">No SendGrid templates found. Please create templates in your SendGrid account first.</p>
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
                          {sendgridTemplates.map((template: SendGridTemplate) => (
                            <SelectItem key={template.id} value={template.id}>
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
          <h3 className="font-medium mb-2">About SendGrid Templates</h3>
          <p>
            SendGrid Dynamic Templates allow you to design visually rich, responsive emails using SendGrid's
            template editor. By mapping these templates to your application's email types, you can manage
            designs in SendGrid while your application handles when and to whom emails are sent.
          </p>
          <p className="mt-2">
            For detailed instructions on setting up and managing SendGrid templates, please refer to the
            {" "}
            <a href="https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              SendGrid documentation
            </a>.
          </p>
        </div>
      </div>
    </>
  );
}