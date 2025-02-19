import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, Plus, Trash2, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AdminBanner } from "@/components/admin/AdminBanner";

type FieldType = "dropdown" | "paragraph" | "input";

interface FormField {
  id?: number;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
}

interface FormTemplate {
  id?: number;
  name: string;
  description?: string;
  isPublished: boolean;
  fields: FormField[];
}

export default function EventApplicationForm() {
  const [location] = useLocation();
  const eventId = parseInt(location.split('/events/')[1]?.split('/')[0], 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formTemplate, setFormTemplate] = useState<FormTemplate>({
    name: "",
    isPublished: false,
    fields: [],
  });

  const templateQuery = useQuery({
    queryKey: ['/api/admin/events', eventId, 'form-template'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/form-template`);
      if (!response.ok) throw new Error('Failed to fetch form template');
      return response.json();
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (templateQuery.data) {
      setFormTemplate(templateQuery.data);
    }
  }, [templateQuery.data]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (template: FormTemplate) => {
      const response = await fetch(`/api/admin/events/${eventId}/form-template`, {
        method: template.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Failed to save form template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/admin/events', eventId, 'form-template']);
      toast({
        title: "Success",
        description: "Form template saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addField = (type: FieldType) => {
    setFormTemplate(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          type,
          label: "",
          required: false,
          order: prev.fields.length,
          options: type === "dropdown" ? [{ label: "", value: "" }] : undefined,
        },
      ],
    }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFormTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeField = (index: number) => {
    setFormTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const addOption = (fieldIndex: number) => {
    setFormTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: [...(field.options || []), { label: "", value: "" }],
            }
          : field
      ),
    }));
  };

  const updateOption = (fieldIndex: number, optionIndex: number, updates: Partial<{ label: string; value: string }>) => {
    setFormTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: field.options?.map((opt, j) => 
                j === optionIndex ? { ...opt, ...updates } : opt
              ),
            }
          : field
      ),
    }));
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setFormTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: field.options?.filter((_, j) => j !== optionIndex),
            }
          : field
      ),
    }));
  };

  if (templateQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AdminBanner />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Event Application Form</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveTemplateMutation.mutate(formTemplate)}
              disabled={saveTemplateMutation.isLoading}
            >
              {saveTemplateMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Form Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formName">Form Name</Label>
              <Input
                id="formName"
                value={formTemplate.name}
                onChange={e => setFormTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter form name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formDescription">Description</Label>
              <Textarea
                id="formDescription"
                value={formTemplate.description || ""}
                onChange={e => setFormTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter form description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formTemplate.isPublished}
                onCheckedChange={checked => setFormTemplate(prev => ({ ...prev, isPublished: checked }))}
              />
              <Label>Published</Label>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Form Fields</h2>
          <div className="flex gap-2 mb-4">
            <Button onClick={() => addField("input")} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Input Field
            </Button>
            <Button onClick={() => addField("paragraph")} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Paragraph Field
            </Button>
            <Button onClick={() => addField("dropdown")} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Dropdown Field
            </Button>
          </div>

          <div className="space-y-4">
            {formTemplate.fields.map((field, fieldIndex) => (
              <Card key={fieldIndex}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1 mr-4">
                        <Label>Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={e => updateField(fieldIndex, { label: e.target.value })}
                          placeholder="Enter field label"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(fieldIndex)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={value => updateField(fieldIndex, { type: value as FieldType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="input">Input</SelectItem>
                            <SelectItem value="paragraph">Paragraph</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.required}
                          onCheckedChange={checked => updateField(fieldIndex, { required: checked })}
                        />
                        <Label>Required</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Placeholder Text</Label>
                      <Input
                        value={field.placeholder || ""}
                        onChange={e => updateField(fieldIndex, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Help Text</Label>
                      <Input
                        value={field.helpText || ""}
                        onChange={e => updateField(fieldIndex, { helpText: e.target.value })}
                        placeholder="Enter help text"
                      />
                    </div>

                    {field.type === "dropdown" && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Options</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(fieldIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {field.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                value={option.label}
                                onChange={e => updateOption(fieldIndex, optionIndex, { label: e.target.value })}
                                placeholder="Option label"
                              />
                              <Input
                                value={option.value}
                                onChange={e => updateOption(fieldIndex, optionIndex, { value: e.target.value })}
                                placeholder="Option value"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(fieldIndex, optionIndex)}
                                className="text-destructive hover:text-destructive/90"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
