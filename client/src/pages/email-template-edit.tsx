import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Editor } from "@tinymce/tinymce-react";
import { AdminBanner } from "../components/admin/AdminBanner";
// import type { EmailTemplate } from "@db/schema/emailTemplates"; // Database import disabled for build
// import { insertEmailTemplateSchema } from "@db/schema/emailTemplates"; // Database import disabled for build

// Define template types
const templateTypes = [
  { id: "welcome", label: "Welcome" },
  { id: "password_reset", label: "Password Reset" },
  { id: "event_registration", label: "Event Registration" },
  { id: "payment_confirmation", label: "Payment Confirmation" },
  { id: "notification", label: "Notification" },
] as const;

// Form values type
type FormValues = z.infer<typeof insertEmailTemplateSchema>;

// TinyMCE API key from environment variable
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

export default function EmailTemplateEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  // Check if we're in create mode by examining the path
  const path = window.location.pathname;
  const isCreateMode = path.includes('/create');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [variables, setVariables] = useState<string[]>([]);

  // Fetch email providers
  const { data: providers } = useQuery({
    queryKey: ["email-providers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-providers");
      if (!response.ok) throw new Error("Failed to fetch providers");
      return response.json();
    },
  });

  // Fetch template if in edit mode
  const { data: template, isLoading: isTemplateLoading, error } = useQuery({
    queryKey: ["email-template", id],
    queryFn: async () => {
      console.log("Fetching template with ID:", id);
      const response = await fetch(`/api/admin/email-templates/${id}`);
      if (!response.ok) {
        console.error("Failed to fetch template:", response.status, response.statusText);
        throw new Error("Failed to fetch template");
      }
      const data = await response.json();
      console.log("Fetched template data:", data);
      return data;
    },
    enabled: !!id && !isCreateMode,
    staleTime: 0, // Always fetch fresh data
  });

  // Define specific type for form values to ensure proper types
  interface EmailTemplateFormValues {
    name: string;
    description: string;
    type: string;
    subject: string;
    content: string;
    senderName: string;
    senderEmail: string;
    isActive: boolean;
    variables: string[];
    providerId?: number;
  }
  
  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(insertEmailTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "welcome",
      subject: "",
      content: "",
      senderName: "",
      senderEmail: "",
      isActive: true,
      variables: [],
      providerId: undefined,
    },
    mode: "onBlur", // Validate on blur for immediate feedback
  });

  // Add debug logging on component mount to see query status
  useEffect(() => {
    console.log('Component mounted with params:', { 
      id, 
      isCreateMode, 
      path: window.location.pathname 
    });
  }, []);
  
  useEffect(() => {
    console.log('Template query status:', { 
      isTemplateLoading, 
      hasTemplate: !!template,
      templateId: template?.id,
      isCreateMode
    });
    
    if (template) {
      console.log("Loading template data:", template);
      
      form.reset({
        name: template.name,
        description: template.description || "",
        type: template.type,
        subject: template.subject,
        content: template.content,
        senderName: template.senderName,
        senderEmail: template.senderEmail,
        isActive: template.isActive === false ? false : true, // Default to true, avoid null
        variables: template.variables || [],
        providerId: template.providerId ? template.providerId : undefined,
      });

      if (template.variables) {
        setVariables(template.variables);
      }
    }
  }, [template, form]);

  const mutation = useMutation({
    mutationFn: async (data: EmailTemplateFormValues) => {
      // Log operation mode for debugging
      console.log(`Template operation mode: ${isCreateMode ? 'CREATE' : 'EDIT'}`, { 
        path: window.location.pathname,
        id,
        isCreateMode
      });
      
      // Ensure all required fields are present and of the correct type
      const cleanedData = {
        ...data,
        description: data.description || "", 
        isActive: data.isActive === false ? false : true,
        variables: data.variables || [],
      };
      
      const endpoint = !isCreateMode
        ? `/api/admin/email-templates/${id}`
        : "/api/admin/email-templates";
        
      const response = await fetch(endpoint, {
        method: isCreateMode ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }));
        throw new Error(errorData.error || "Failed to save template");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Success",
        description: `Template ${isCreateMode ? "created" : "updated"} successfully`,
      });
      navigate("/admin/email-templates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailTemplateFormValues) => {
    mutation.mutate(data);
  };

  const handlePreview = () => {
    try {
      const formData = form.getValues();
      // Make sure we're sending valid data
      const cleanedData = {
        ...formData,
        description: formData.description || "",
        isActive: formData.isActive === false ? false : true,
        variables: formData.variables || [],
        providerId: formData.providerId ? Number(formData.providerId) : null
      };
      
      console.log("Preparing preview with data:", cleanedData);
      const encodedData = encodeURIComponent(JSON.stringify(cleanedData));
      window.open(`/api/admin/email-templates/preview?template=${encodedData}`, '_blank');
    } catch (e) {
      console.error("Failed to generate preview:", e);
      toast({
        title: "Preview error",
        description: "Could not generate preview. Check console for details.",
        variant: "destructive"
      });
    }
  };

  if (isTemplateLoading && !isCreateMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AdminBanner />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/admin/email-templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {isCreateMode ? "Create Email Template" : "Edit Email Template"}
          </h1>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="providerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Provider</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value ? parseInt(value, 10) : undefined);
                        }}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers?.map((provider: any) => (
                            <SelectItem 
                              key={provider.id} 
                              value={provider.id.toString()}
                            >
                              {provider.providerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The email provider that will be used to send this template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Welcome Email" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this email template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="password_reset">Password Reset</SelectItem>
                          <SelectItem value="event_registration">Event Registration</SelectItem>
                          <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categorizes the template for automatic email routing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable or disable this email template
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this email template's purpose"
                        onChange={field.onChange}
                        value={field.value || ""}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      A short description explaining when this template is used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender Name</FormLabel>
                      <FormControl>
                        <Input placeholder="MatchPro" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name that will appear in the From field
                      </FormDescription>
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
                        <Input placeholder="notifications@matchpro.ai" {...field} />
                      </FormControl>
                      <FormDescription>
                        The email address that will appear in the From field
                      </FormDescription>
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
                      <Input placeholder="Welcome to MatchPro" {...field} />
                    </FormControl>
                    <FormDescription>
                      The subject line of the email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Body</FormLabel>
                    <FormControl>
                      <div className="border rounded-md overflow-hidden">
                        <Editor
                          apiKey={TINYMCE_API_KEY}
                          value={field.value}
                          onEditorChange={(content) => field.onChange(content)}
                          init={{
                            height: 600, // Taller editor for dedicated page
                            menubar: 'file edit view insert format tools table help',
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'help', 'wordcount',
                              'codesample', 'wordcount'
                            ],
                            codesample_languages: [
                              { text: 'HTML/XML', value: 'markup' },
                              { text: 'JavaScript', value: 'javascript' },
                              { text: 'CSS', value: 'css' }
                            ],
                            toolbar1: 'code fullscreen | undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify',
                            toolbar2: 'bullist numlist outdent indent | link image media | codesample removeformat | mergefields | help',
                            extended_valid_elements: '*[*]', // Allow all elements and attributes
                            valid_children: '+body[style]', // Allow style tag in body
                            schema: 'html5',
                            entity_encoding: 'raw',
                            verify_html: false, // Don't verify/filter HTML
                            valid_elements: '*[*]', // Allow all elements and attributes
                            // Add custom file browser for images and media
                            file_picker_callback: function (callback, value, meta) {
                              // Use prompt to allow direct URL input
                              let url = prompt('Enter URL', 'https://');
                              if (url) callback(url);
                            },
                            setup: (editor) => {
                              const openMergeFieldsDialog = () => {
                                // Create a custom DOM element for the dialog
                                const dialogElement = document.createElement('div');
                                dialogElement.className = 'tinymce-custom-dialog';
                                dialogElement.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;';
                                
                                // Create the dialog content
                                const dialogContent = document.createElement('div');
                                dialogContent.style.cssText = 'background: white; padding: 20px; border-radius: 4px; width: 400px; max-width: 90%; box-shadow: 0 4px 10px rgba(0,0,0,0.2);';
                                
                                // Add dialog title
                                const title = document.createElement('h3');
                                title.textContent = 'Insert Merge Field';
                                title.style.cssText = 'margin-top: 0; margin-bottom: 15px; font-size: 18px;';
                                
                                // Add select dropdown
                                const select = document.createElement('select');
                                select.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;';
                                
                                // Add options to select
                                const mergeFieldOptions = [
                                  { text: 'Choose a field...', value: '' },
                                  { text: 'First Name', value: '{{firstName}}' },
                                  { text: 'Last Name', value: '{{lastName}}' },
                                  { text: 'Username', value: '{{username}}' },
                                  { text: 'Reset URL', value: '{{resetUrl}}' },
                                  { text: 'Reset Token', value: '{{token}}' }
                                ];
                                
                                mergeFieldOptions.forEach(option => {
                                  const optionElement = document.createElement('option');
                                  optionElement.textContent = option.text;
                                  optionElement.value = option.value;
                                  select.appendChild(optionElement);
                                });
                                
                                // Add buttons container
                                const buttonContainer = document.createElement('div');
                                buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;';
                                
                                // Add cancel button
                                const cancelButton = document.createElement('button');
                                cancelButton.textContent = 'Cancel';
                                cancelButton.style.cssText = 'padding: 8px 12px; background: #f1f1f1; border: none; border-radius: 4px; cursor: pointer;';
                                cancelButton.onclick = () => {
                                  document.body.removeChild(dialogElement);
                                };
                                
                                // Add insert button
                                const insertButton = document.createElement('button');
                                insertButton.textContent = 'Insert Field';
                                insertButton.style.cssText = 'padding: 8px 12px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;';
                                insertButton.onclick = () => {
                                  if (select.value) {
                                    editor.insertContent(select.value);
                                  }
                                  document.body.removeChild(dialogElement);
                                };
                                
                                // Assemble the dialog
                                buttonContainer.appendChild(cancelButton);
                                buttonContainer.appendChild(insertButton);
                                
                                dialogContent.appendChild(title);
                                dialogContent.appendChild(select);
                                dialogContent.appendChild(buttonContainer);
                                
                                dialogElement.appendChild(dialogContent);
                                
                                // Add click outside to close
                                dialogElement.addEventListener('click', (e) => {
                                  if (e.target === dialogElement) {
                                    document.body.removeChild(dialogElement);
                                  }
                                });
                                
                                // Add to DOM
                                document.body.appendChild(dialogElement);
                              };
                              
                              // Add a button for merge fields
                              editor.ui.registry.addButton('mergefields', {
                                text: 'Merge Fields',
                                tooltip: 'Insert merge field',
                                onAction: openMergeFieldsDialog
                              });
                            },
                            // Disable auto-formatting of HTML 
                            indent: false,
                            forced_root_block: '',
                            force_br_newlines: false,
                            force_p_newlines: false,
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The content of the email. HTML is fully supported. Use the "code" button in the toolbar to edit HTML.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/admin/email-templates")}
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
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isCreateMode ? "Create Template" : "Update Template"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}