
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export interface EmailTemplate {
  id: number;
  name: string;
  type: string;
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const templateSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Invalid sender email"),
  isDefault: z.boolean().default(false),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const templateTypes = [
  { value: "registration", label: "Registration" },
  { value: "payment", label: "Payment" },
  { value: "confirmation", label: "Confirmation" },
  { value: "password_reset", label: "Password Reset" },
  { value: "notification", label: "Notification" },
  { value: "welcome", label: "Welcome" },
];

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onClose: () => void;
  onSave: (template: Partial<EmailTemplate>) => Promise<void>;
}

export function EmailTemplateEditor({ 
  template, 
  onClose, 
  onSave 
}: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: template || {
      name: "",
      type: "",
      subject: "",
      content: "",
      senderName: "",
      senderEmail: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset(template);
    }
  }, [template, form]);

  const handleSubmit = async (values: TemplateFormValues) => {
    try {
      setIsSubmitting(true);
      await onSave(values);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input placeholder="Template name" {...field} />
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
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Line</FormLabel>
              <FormControl>
                <Input placeholder="Subject" {...field} />
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
                <Textarea 
                  placeholder="Email content" 
                  {...field} 
                  className="min-h-[200px]"
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
                  <Input placeholder="Sender name" {...field} />
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
                  <Input placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as Default Template</FormLabel>
                <p className="text-sm text-muted-foreground">
                  This will be used as the default template for this type
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
