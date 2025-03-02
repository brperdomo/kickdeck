
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash } from "lucide-react";

export function FormTemplateEditor({ id }: { id?: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [template, setTemplate] = useState({
    id: id ? parseInt(id) : undefined,
    name: "",
    description: "",
    isPublished: false,
    fields: [],
    eventId: "0" // 0 for global templates
  });

  const [newField, setNewField] = useState({
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    helpText: "",
    options: []
  });

  const [newOption, setNewOption] = useState({
    label: "",
    value: ""
  });

  // Fetch template if editing
  const templateQuery = useQuery({
    queryKey: ['form-template', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/admin/form-templates/${id}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      return response.json();
    },
    enabled: !!id,
    onSuccess: (data) => {
      if (data) {
        setTemplate(data);
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = isEditing ? 'PUT' : 'POST';
      const endpoint = isEditing 
        ? `/api/admin/form-templates/${id}` 
        : '/api/admin/form-templates';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['form-templates']);
      toast({
        title: "Success",
        description: `Template ${isEditing ? 'updated' : 'created'} successfully`
      });
      navigate('/admin/form-templates');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addField = () => {
    if (!newField.label) {
      toast({
        title: "Error",
        description: "Field label is required",
        variant: "destructive"
      });
      return;
    }

    const field = {
      ...newField,
      order: template.fields.length,
      id: Date.now() // Temporary ID for UI
    };

    setTemplate({
      ...template,
      fields: [...template.fields, field]
    });

    setNewField({
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      helpText: "",
      options: []
    });
  };

  const addOption = () => {
    if (!newOption.label || !newOption.value) {
      toast({
        title: "Error",
        description: "Option label and value are required",
        variant: "destructive"
      });
      return;
    }

    setNewField({
      ...newField,
      options: [...newField.options, { ...newOption, order: newField.options.length }]
    });

    setNewOption({ label: "", value: "" });
  };

  const removeField = (index: number) => {
    const newFields = [...template.fields];
    newFields.splice(index, 1);
    setTemplate({ ...template, fields: newFields });
  };

  const removeOption = (index: number) => {
    const newOptions = [...newField.options];
    newOptions.splice(index, 1);
    setNewField({ ...newField, options: newOptions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(template);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Form Template' : 'Create Form Template'}
        </h1>
        <Button onClick={() => navigate('/admin/form-templates')}>
          Back to Templates
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Basic information about this form template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="Enter template name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={template.description || ""}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                placeholder="Enter template description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={template.isPublished}
                onCheckedChange={(checked) => setTemplate({ ...template, isPublished: checked })}
              />
              <Label>Published</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fields</CardTitle>
            <CardDescription>Define the fields for this form template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {template.fields.map((field: any, index: number) => (
                <div key={field.id || index} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{field.label}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Type: {field.type}</span>
                    <span>Required: {field.required ? 'Yes' : 'No'}</span>
                    {field.placeholder && <span>Placeholder: {field.placeholder}</span>}
                    {field.helpText && <span>Help Text: {field.helpText}</span>}
                  </div>
                  {field.type === 'dropdown' && field.options && field.options.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium">Options:</h4>
                      <ul className="ml-4 list-disc text-sm">
                        {field.options.map((option: any, optIndex: number) => (
                          <li key={optIndex}>
                            {option.label} ({option.value})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Field Label</Label>
              <Input
                id="fieldLabel"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g. First Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <select
                id="fieldType"
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="text">Text</option>
                <option value="textarea">Text Area</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="checkbox">Checkbox</option>
                <option value="dropdown">Dropdown</option>
                <option value="date">Date</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newField.required}
                onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
              />
              <Label>Required Field</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldPlaceholder">Placeholder Text</Label>
              <Input
                id="fieldPlaceholder"
                value={newField.placeholder}
                onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                placeholder="e.g. Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldHelpText">Help Text</Label>
              <Input
                id="fieldHelpText"
                value={newField.helpText}
                onChange={(e) => setNewField({ ...newField, helpText: e.target.value })}
                placeholder="e.g. Your legal first name"
              />
            </div>

            {newField.type === 'dropdown' && (
              <div className="p-4 border rounded-md space-y-4">
                <h4 className="font-semibold">Options</h4>
                
                {newField.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 pl-2 border-l-2 border-gray-200">
                    <span className="flex-1">{option.label} ({option.value})</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="optionLabel">Option Label</Label>
                    <Input
                      id="optionLabel"
                      value={newOption.label}
                      onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                      placeholder="e.g. Yes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionValue">Option Value</Label>
                    <Input
                      id="optionValue"
                      value={newOption.value}
                      onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      placeholder="e.g. yes"
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addOption} 
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Option
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="button" 
              onClick={addField} 
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Field
            </Button>
          </CardFooter>
        </Card>

        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin/form-templates')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saveMutation.isLoading}
          >
            {saveMutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </form>
    </div>
  );
}
