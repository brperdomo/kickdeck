import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  senderEmail: string;
  senderName: string;
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
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [content, setContent] = useState(template?.content || '');
  const [type, setType] = useState(template?.type || TEMPLATE_TYPES[0]);
  const [senderEmail, setSenderEmail] = useState(template?.senderEmail || '');
  const [senderName, setSenderName] = useState(template?.senderName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !content || !type || !senderEmail || !senderName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        subject,
        content,
        type,
        senderEmail,
        senderName
      });
      toast({
        title: "Success",
        description: "Email template saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Welcome Email"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Template Type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace('_', ' ').charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="senderName">Sender Name *</Label>
          <Input
            id="senderName"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Organization Name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senderEmail">Sender Email *</Label>
          <Input
            id="senderEmail"
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="noreply@organization.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Email Subject *</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Email Content *</Label>
        <Card>
          <CardContent className="p-0">
            <Editor
              apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
              value={content}
              onEditorChange={(content) => setContent(content)}
              init={{
                height: 400,
                menubar: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family: Inter,sans-serif; font-size: 14px }'
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
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
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Template'
          )}
        </Button>
      </div>
    </form>
  );
}
