import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertEmailTemplateSchema, type EmailTemplate } from "@db/schema/emailTemplates";

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

interface EmailTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
}

// Function to fetch TinyMCE API key from server
const useTinyMCEApiKey = () => {
  return useQuery({
    queryKey: ["tinymce-config"],
    queryFn: async () => {
      const response = await fetch("/api/config/tinymce");
      if (!response.ok) {
        throw new Error("Failed to fetch TinyMCE configuration");
      }
      const data = await response.json();
      return data.apiKey;
    },
    retry: 1,
    staleTime: Infinity // API key won't change during the session
  });
};

export function EmailTemplateModal({ open, onOpenChange, template }: EmailTemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState<string>("");
  const { data: tinyMCEApiKey, isLoading: isLoadingApiKey, isError: isApiKeyError } = useTinyMCEApiKey();

  const { data: providers } = useQuery({
    queryKey: ["email-providers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-providers");
      if (!response.ok) throw new Error("Failed to fetch providers");
      return response.json();
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(insertEmailTemplateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      type: template?.type || "welcome",
      subject: template?.subject || "",
      content: template?.content || "",
      senderName: template?.senderName || "",
      senderEmail: template?.senderEmail || "",
      isActive: template?.isActive ?? true,
      variables: template?.variables || [],
      providerId: template?.providerId ? template.providerId : undefined,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description ?? "",
        type: template.type,
        subject: template.subject,
        content: template.content,
        senderName: template.senderName,
        senderEmail: template.senderEmail,
        isActive: template.isActive ?? true,
        variables: template.variables ?? [],
        providerId: template.providerId ? template.providerId : undefined, // Properly handle providerId
      });

      if (template.variables) {
        setVariables(template.variables);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        type: "welcome",
        subject: "",
        content: "",
        senderName: "",
        senderEmail: "",
        isActive: true,
        variables: [],
        providerId: undefined, // Use undefined for proper form validation
      });
      setVariables([]);
    }
  }, [template, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const endpoint = template
        ? `/api/admin/email-templates/${template.id}`
        : "/api/admin/email-templates";
      const response = await fetch(endpoint, {
        method: template ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Success",
        description: `Template ${template ? "updated" : "created"} successfully`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Email Template" : "Create Email Template"}
          </DialogTitle>
          <DialogDescription>
            Create or modify email templates for various system notifications.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="template-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={field.value?.toString() || ""}
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
                      defaultValue={field.value}
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
                    <FormMessage />
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
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Name</FormLabel>
                    <FormControl>
                      <Input placeholder="KickDeck" {...field} />
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
                      <Input placeholder="notifications@kickdeck.io" {...field} />
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
                    <Input placeholder="Welcome to KickDeck" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Email Body</FormLabel>
                  <FormControl>
                    <div className="border rounded-md overflow-hidden">
                      {isLoadingApiKey ? (
                        <div className="flex items-center justify-center p-8 bg-gray-50 border rounded-md">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="ml-2">Loading editor...</span>
                        </div>
                      ) : isApiKeyError ? (
                        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                          <p>Failed to load the TinyMCE editor. Please try refreshing the page.</p>
                        </div>
                      ) : (
                        <Editor
                          apiKey={tinyMCEApiKey}
                          value={field.value}
                          onEditorChange={(content) => field.onChange(content)}
                          init={{
                            height: 500,
                            menubar: 'file edit view insert format tools table help',
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'help', 'wordcount',
                              'codesample', 'paste', 'source'
                            ],
                            codesample_languages: [
                              { text: 'HTML/XML', value: 'markup' },
                              { text: 'JavaScript', value: 'javascript' },
                              { text: 'CSS', value: 'css' }
                            ],
                            toolbar1: 'code source fullscreen | undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify',
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
                    The content of the email. HTML is fully supported. Use the "source" button in the toolbar to edit HTML directly.
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
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  const formData = form.getValues();
                  window.open(`/api/admin/email-templates/preview?template=${encodeURIComponent(JSON.stringify(formData))}`, '_blank');
                }}
              >
                Preview
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {template ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}