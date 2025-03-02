
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Save, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormField {
  type: "input" | "paragraph" | "dropdown";
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  order: number;
  options?: { label: string; value: string }[];
}

interface FormTemplate {
  name: string;
  description: string;
  isPublished: boolean;
  fields: FormField[];
}

export default function FormTemplateCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("edit");
  const [formTemplate, setFormTemplate] = useState<FormTemplate>({
    name: "",
    description: "",
    isPublished: false,
    fields: [],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: FormTemplate) => {
      const response = await fetch('/api/admin/form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form template created successfully",
      });
      navigate("/admin/form-templates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addField = (type: "input" | "paragraph" | "dropdown") => {
    setFormTemplate(prev => ({
      ...prev,
      fields: [
        ...(prev.fields || []),
        {
          type,
          label: "",
          required: false,
          order: (prev.fields || []).length,
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

  const updateOption = (
    fieldIndex: number, 
    optionIndex: number, 
    updates: Partial<{ label: string; value: string }>
  ) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate template
    if (!formTemplate.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate fields
    for (let i = 0; i < formTemplate.fields.length; i++) {
      const field = formTemplate.fields[i];
      if (!field.label.trim()) {
        toast({
          title: "Error",
          description: `Field ${i + 1} requires a label`,
          variant: "destructive",
        });
        return;
      }
      
      // Validate dropdown options
      if (field.type === "dropdown" && field.options) {
        for (let j = 0; j < field.options.length; j++) {
          const option = field.options[j];
          if (!option.label.trim() || !option.value.trim()) {
            toast({
              title: "Error",
              description: `Option ${j + 1} in field "${field.label}" requires both label and value`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }
    
    createTemplateMutation.mutate(formTemplate);
  };

  const renderEditor = () => {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formTemplate.name}
                onChange={e => setFormTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formTemplate.isPublished}
                  onCheckedChange={checked => setFormTemplate(prev => ({ ...prev, isPublished: checked }))}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formTemplate.description}
              onChange={e => setFormTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter template description"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Form Fields</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => addField("input")}>
                <Plus className="h-4 w-4 mr-1" /> Text Field
              </Button>
              <Button variant="outline" size="sm" onClick={() => addField("paragraph")}>
                <Plus className="h-4 w-4 mr-1" /> Paragraph
              </Button>
              <Button variant="outline" size="sm" onClick={() => addField("dropdown")}>
                <Plus className="h-4 w-4 mr-1" /> Dropdown
              </Button>
            </div>
          </div>

          {formTemplate.fields.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-md">
              <p className="text-gray-500">No fields added yet. Click one of the buttons above to add a field.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formTemplate.fields.map((field, index) => (
                <Card key={index} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    onClick={() => removeField(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <CardContent className="pt-6">
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={value => updateField(index, { type: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="input">Text Field</SelectItem>
                              <SelectItem value="paragraph">Paragraph</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={e => updateField(index, { label: e.target.value })}
                            placeholder="Enter field label"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={e => updateField(index, { placeholder: e.target.value })}
                            placeholder="Enter placeholder text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Help Text</Label>
                          <Input
                            value={field.helpText || ""}
                            onChange={e => updateField(index, { helpText: e.target.value })}
                            placeholder="Enter help text"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`required-${index}`}
                          checked={field.required}
                          onCheckedChange={checked => updateField(index, { required: checked })}
                        />
                        <Label htmlFor={`required-${index}`}>Required</Label>
                      </div>

                      {field.type === "dropdown" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addOption(index)}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Option
                            </Button>
                          </div>
                          {field.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <Input
                                value={option.label}
                                onChange={e => updateOption(index, optionIndex, { label: e.target.value })}
                                placeholder="Option Label"
                                className="flex-1"
                              />
                              <Input
                                value={option.value}
                                onChange={e => updateOption(index, optionIndex, { value: e.target.value })}
                                placeholder="Option Value"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(index, optionIndex)}
                                disabled={field.options?.length === 1}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">{formTemplate.name || "Untitled Form"}</h1>
        {formTemplate.description && (
          <p className="text-gray-600 mb-6">{formTemplate.description}</p>
        )}
        <div className="space-y-6">
          {formTemplate.fields?.map((field, index) => (
            <div key={index} className="space-y-2">
              <label className="block font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.helpText && (
                <p className="text-sm text-gray-500">{field.helpText}</p>
              )}
              {field.type === "input" && (
                <Input placeholder={field.placeholder || ""} />
              )}
              {field.type === "paragraph" && (
                <Textarea placeholder={field.placeholder || ""} />
              )}
              {field.type === "dropdown" && (
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option, i) => (
                      <SelectItem key={i} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}

          {formTemplate.fields.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No fields to preview. Add some fields in the editor.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/form-templates")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create Form Template</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">{renderEditor()}</TabsContent>
        <TabsContent value="preview">{renderPreview()}</TabsContent>
      </Tabs>
    </div>
  );
}
