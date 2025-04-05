
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowLeft, Save, Trash } from "lucide-react";

export function FormTemplateEditor({ editMode = false, existingTemplate = null }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [template, setTemplate] = useState({
    id: existingTemplate?.id || null,
    name: existingTemplate?.name || "",
    description: existingTemplate?.description || "",
    isPublished: existingTemplate?.isPublished || false,
    fields: existingTemplate?.fields || []
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form template created successfully"
      });
      navigate("/admin/form-templates");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive"
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async () => {
      // Use the proper endpoint for standalone form templates
      const response = await fetch(`/api/admin/form-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form template updated successfully"
      });
      navigate("/admin/form-templates");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update template",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!template.name) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      });
      return;
    }

    if (editMode) {
      updateTemplateMutation.mutate();
    } else {
      createTemplateMutation.mutate();
    }
  };

  const addField = (type) => {
    setTemplate(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          type,
          label: "",
          required: false,
          order: prev.fields.length,
          placeholder: "",
          helpText: "",
          options: type === "dropdown" ? [{ label: "", value: "" }] : []
        }
      ]
    }));
  };

  const updateField = (index, updates) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (index) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const addOption = (fieldIndex) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: [...field.options, { label: "", value: "" }]
            }
          : field
      )
    }));
  };

  const updateOption = (fieldIndex, optionIndex, updates) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: field.options.map((option, j) => 
                j === optionIndex ? { ...option, ...updates } : option
              )
            }
          : field
      )
    }));
  };

  const removeOption = (fieldIndex, optionIndex) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: field.options.filter((_, j) => j !== optionIndex)
            }
          : field
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/form-templates")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {editMode ? "Update Template" : "Save Template"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editMode ? "Edit Form Template" : "Create Form Template"}</CardTitle>
          <CardDescription>
            Define the template details and form fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={template.isPublished}
                  onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, isPublished: checked }))}
                />
                <Label htmlFor="isPublished">Published</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={template.description}
              onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter template description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Fields</CardTitle>
          <CardDescription>
            Add and configure fields for your form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addField("text")}>
              <Plus className="mr-1 h-4 w-4" />
              Text Field
            </Button>
            <Button variant="outline" size="sm" onClick={() => addField("textarea")}>
              <Plus className="mr-1 h-4 w-4" />
              Text Area
            </Button>
            <Button variant="outline" size="sm" onClick={() => addField("dropdown")}>
              <Plus className="mr-1 h-4 w-4" />
              Dropdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => addField("number")}>
              <Plus className="mr-1 h-4 w-4" />
              Number
            </Button>
            <Button variant="outline" size="sm" onClick={() => addField("checkbox")}>
              <Plus className="mr-1 h-4 w-4" />
              Checkbox
            </Button>
            <Button variant="outline" size="sm" onClick={() => addField("date")}>
              <Plus className="mr-1 h-4 w-4" />
              Date
            </Button>
          </div>

          <div className="space-y-4">
            {template.fields.length === 0 && (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">Add fields to your form using the buttons above</p>
              </div>
            )}

            {template.fields.map((field, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium capitalize">{field.type} Field</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-destructive h-8 w-8 p-0"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`field-${index}-label`}>Field Label</Label>
                      <Input
                        id={`field-${index}-label`}
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Enter field label"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`field-${index}-required`}
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(index, { required: checked })}
                        />
                        <Label htmlFor={`field-${index}-required`}>Required Field</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`field-${index}-placeholder`}>Placeholder Text</Label>
                      <Input
                        id={`field-${index}-placeholder`}
                        value={field.placeholder || ""}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`field-${index}-help`}>Help Text</Label>
                      <Input
                        id={`field-${index}-help`}
                        value={field.helpText || ""}
                        onChange={(e) => updateField(index, { helpText: e.target.value })}
                        placeholder="Enter help text"
                      />
                    </div>
                  </div>

                  {field.type === "dropdown" && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Options</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(index)}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>

                      {field.options.length === 0 && (
                        <div className="text-center p-4 border border-dashed rounded-lg">
                          <p className="text-muted-foreground">Add options for your dropdown</p>
                        </div>
                      )}

                      {field.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2 mt-2">
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption(index, optionIndex, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            placeholder="Option label"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index, optionIndex)}
                            className="text-destructive h-8 w-8 p-0"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
