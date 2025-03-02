import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMAIL_TRIGGER_TYPES = [
  { value: "registration_confirmation", label: "Registration Confirmation" },
  { value: "payment_receipt", label: "Payment Receipt" },
  { value: "password_reset", label: "Password Reset" },
  { value: "account_verification", label: "Account Verification" },
  { value: "event_reminder", label: "Event Reminder" },
  { value: "schedule_update", label: "Schedule Update" },
  { value: "team_invitation", label: "Team Invitation" },
  { value: "welcome", label: "Welcome Email" }
];

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Invalid email address"),
  isDefault: z.boolean().default(false),
});

interface Props {
  template?: EmailTemplate;
  onSave: (template: Omit<EmailTemplate, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function EmailTemplateEditor({ template, onSave, onCancel }: Props) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      type: template?.type || "",
      subject: template?.subject || "",
      content: template?.content || "<p>Hello,</p><p>Your content here...</p><p>Regards,</p><p>Your Organization</p>",
      senderName: template?.senderName || "",
      senderEmail: template?.senderEmail || "",
      isDefault: template?.isDefault || false,
    },
  });

  useEffect(() => {
    // Update preview when content changes
    setPreviewContent(form.getValues().content);
  }, [form.watch("content")]);

  const handlePreview = async () => {
    try {
      const response = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: form.getValues().content,
          subject: form.getValues().subject,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await response.json();
      setPreviewContent(data.preview);
      setActiveTab("preview");
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSave(values);
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Edit Template</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Welcome Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Trigger</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="" disabled>Select a trigger</option>
                          {EMAIL_TRIGGER_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>
                        When this email will be sent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Organization" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender Email</FormLabel>
                      <FormControl>
                        <Input placeholder="no-reply@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Welcome to our platform!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Content</FormLabel>
                    <FormControl>
                      <ReactQuill 
                        theme="snow" 
                        value={field.value} 
                        onChange={field.onChange}
                        className="h-64 mb-12"
                      />
                    </FormControl>
                    <FormDescription>
                      You can use placeholder variables: {"{name}"}, {"{event_name}"}, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Set as Default Template
                      </FormLabel>
                      <FormDescription>
                        Make this the default template for this trigger type
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handlePreview}
                >
                  Preview
                </Button>
                <Button type="submit">
                  {template ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 pt-4">
          <div className="border rounded-md p-4">
            <h3 className="font-semibold mb-2">
              Subject: {form.getValues().subject}
            </h3>
            <div className="border-t pt-2">
              <div 
                dangerouslySetInnerHTML={{ __html: previewContent }} 
                className="prose max-w-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setActiveTab("edit")}
            >
              Back to Editor
            </Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit(onSubmit)}
            >
              {template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}