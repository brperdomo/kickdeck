import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplateEditor, EmailTemplate } from "./EmailTemplateEditor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";


const EMAIL_TRIGGER_LABELS: Record<string, string> = {
  "registration_confirmation": "Registration Confirmation",
  "payment_receipt": "Payment Receipt",
  "password_reset": "Password Reset",
  "account_verification": "Account Verification",
  "event_reminder": "Event Reminder",
  "schedule_update": "Schedule Update",
  "team_invitation": "Team Invitation",
  "welcome": "Welcome Email"
};

// Placeholder component for Email Server Configuration
function EmailServerConfig() {
  return (
    <div>
      <h1>Email Server Configuration</h1>
      {/* Add your form elements here for SMTP server settings */}
      <p>This section will contain input fields for configuring the email server.</p>
    </div>
  );
}

export function EmailTemplateManagement() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Partial<EmailTemplate>>();
  const [activeTab, setActiveTab] = useState("all");
  const [configTab, setConfigTab] = useState("templates"); // Added state for tabs


  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch email templates');
      }
      return response.json() as Promise<EmailTemplate[]>;
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<EmailTemplate, 'id'>) => {
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        throw new Error('Failed to create template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setIsEditorOpen(false);
      toast({
        title: "Success",
        description: "Email template created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) {
        throw new Error('Failed to update template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setIsEditorOpen(false);
      toast({
        title: "Success",
        description: "Email template updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
    }
  });

  const handlePreview = async (template: Partial<EmailTemplate>) => {
    try {
      const response = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error('Failed to preview template');
      }

      setPreviewTemplate(template);
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview email template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      await deleteTemplateMutation.mutateAsync(template.id);
      toast({
        title: "Success",
        description: "Email template deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive"
      });
    }
  };

  const handleSave = async (template: Omit<EmailTemplate, 'id'>) => {
    try {
      if (selectedTemplate) {
        await updateTemplateMutation.mutateAsync({
          ...template,
          id: selectedTemplate.id,
          createdAt: selectedTemplate.createdAt,
          updatedAt: new Date().toISOString()
        });
      } else {
        await createTemplateMutation.mutateAsync(template);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      throw error;
    }
  };

  // Group templates by trigger type
  const templatesByTrigger: Record<string, EmailTemplate[]> = {};
  const allTemplates = templatesQuery.data || [];

  allTemplates.forEach(template => {
    if (!templatesByTrigger[template.type]) {
      templatesByTrigger[template.type] = [];
    }
    templatesByTrigger[template.type].push(template);
  });

  // Get unique trigger types for the tabs
  const triggers = Object.keys(templatesByTrigger);

  // Filter templates based on active tab
  const filteredTemplates = activeTab === "all" 
    ? allTemplates 
    : templatesByTrigger[activeTab] || [];

  return (
    <div className="space-y-4">
      <Tabs value={configTab} onValueChange={setConfigTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="server">Server Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium mb-2">Email Templates</h3>
              <p className="text-sm text-muted-foreground">
                Manage the email templates used throughout the application
              </p>
            </div>
            <Button onClick={() => setIsEditorOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="flex space-x-2 pb-2 border-b">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("all")}
            >
              All
            </Button>
            <Button
              variant={activeTab === "system" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("system")}
            >
              System
            </Button>
            <Button
              variant={activeTab === "custom" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("custom")}
            >
              Custom
            </Button>
          </div>

          {templatesQuery.isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templatesQuery.error ? (
            <div className="bg-destructive/10 p-4 rounded-md flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              <span>Failed to load email templates</span>
            </div>
          ) : (
            <>
              {allTemplates.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">No email templates created yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSelectedTemplate(undefined);
                      setIsEditorOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Template
                  </Button>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Templates</TabsTrigger>
                    {triggers.map(trigger => (
                      <TabsTrigger key={trigger} value={trigger}>
                        {EMAIL_TRIGGER_LABELS[trigger] || trigger}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={activeTab} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle>{template.name}</CardTitle>
                            <Badge>{EMAIL_TRIGGER_LABELS[template.type] || template.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Subject:</strong> {template.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>From:</strong> {template.senderName} &lt;{template.senderEmail}&gt;
                          </p>
                          {template.isDefault && (
                            <Badge variant="outline" className="mt-2">
                              Default Template
                            </Badge>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(template)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsEditorOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(template)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}

        </TabsContent>

        <TabsContent value="server">
          <EmailServerConfig />
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
          </DialogHeader>
          <EmailTemplateEditor
            template={selectedTemplate}
            onSave={handleSave}
            onPreview={handlePreview}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md p-4">
            <div className="mb-4 p-2 bg-muted rounded">
              <p><strong>From:</strong> {previewTemplate?.senderName} &lt;{previewTemplate?.senderEmail}&gt;</p>
              <p><strong>Subject:</strong> {previewTemplate?.subject}</p>
            </div>
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: previewTemplate?.content || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}