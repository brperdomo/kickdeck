import React, { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { z } from "zod";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  senderEmail: string;
  senderName: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: Omit<EmailTemplate, 'id'>) => Promise<void>;
  onPreview?: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

const TEMPLATE_TYPES = [
  'registration',
  'payment_confirmation',
  'password_reset',
  'account_creation',
  'event_reminder',
  'team_update'
];

export function EmailTemplateEditor({ 
  template, 
  onSave, 
  onPreview, 
  onCancel 
}: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [content, setContent] = useState(template?.content || '');
  const [type, setType] = useState(template?.type || TEMPLATE_TYPES[0]);
  const [senderEmail, setSenderEmail] = useState(template?.senderEmail || '');
  const [senderName, setSenderName] = useState(template?.senderName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Invalid sender email"),
});

const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrors({});

      // Validate form data
      const result = emailTemplateSchema.safeParse({
        name,
        type,
        subject,
        content,
        senderName,
        senderEmail
      });

      if (!result.success) {
        const formattedErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          formattedErrors[err.path[0].toString()] = err.message;
        });
        setErrors(formattedErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive"
        });
        return;
      }

      // Save template
      await onSave({
        name,
        type,
        subject,
        content,
        senderName,
        senderEmail,
        isDefault: template?.isDefault || false
      });

      toast({
        title: "Success",
        description: "Email template saved successfully"
      });
    } catch (error) {
      console.error("Failed to save template:", error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => {
    handleSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Registration Confirmation"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Template Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your Organization"
                className={errors.senderName ? "border-red-500" : ""}
              />
              {errors.senderName && <p className="text-sm text-red-500">{errors.senderName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input
                id="senderEmail"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="noreply@example.com"
                className={errors.senderEmail ? "border-red-500" : ""}
              />
              {errors.senderEmail && <p className="text-sm text-red-500">{errors.senderEmail}</p>}
            </div>
          </div>

      <div className="space-y-2 mb-4">
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Welcome to our platform!"
          className={errors.subject ? "border-red-500" : ""}
        />
        {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Email Content</Label>
        <div className={errors.content ? "border border-red-500 rounded-md" : ""}>
          <Editor
            value={content}
            onEditorChange={(content) => setContent(content)}
            init={{
              height: 350,
              menubar: true,
              // Use basic editor without requiring premium plugins
              plugins: 'link lists',
              toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | removeformat',
              // Use CDN for TinyMCE resources
              base_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.3',
              suffix: '.min'
            }}
          />
        </div>
        {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        {onPreview && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onPreview({ subject, content, senderName, senderEmail })}
          >
            <Send className="w-4 h-4 mr-2" />
            Preview
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}