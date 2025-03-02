
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface FormTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
}

export function FormTemplateModal({ isOpen, onClose, eventId }: FormTemplateModalProps) {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<any[]>([]);

  const addField = () => {
    setFields([
      ...fields,
      {
        label: "",
        type: "input",
        required: false,
        placeholder: "",
        helpText: "",
        order: fields.length,
        options: [],
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: any) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const addOption = (fieldIndex: number) => {
    const updatedFields = [...fields];
    if (!updatedFields[fieldIndex].options) {
      updatedFields[fieldIndex].options = [];
    }
    updatedFields[fieldIndex].options.push({
      label: "",
      value: "",
      order: updatedFields[fieldIndex].options.length,
    });
    setFields(updatedFields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, updates: any) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options[optionIndex] = {
      ...updatedFields[fieldIndex].options[optionIndex],
      ...updates,
    };
    setFields(updatedFields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options = updatedFields[fieldIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setFields(updatedFields);
  };

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Error",
        description: "At least one field is required",
        variant: "destructive",
      });
      return;
    }

    // Validate field labels
    for (const field of fields) {
      if (!field.label.trim()) {
        toast({
          title: "Error",
          description: "All fields must have a label",
          variant: "destructive",
        });
        return;
      }

      if (field.type === "dropdown" && (!field.options || field.options.length === 0)) {
        toast({
          title: "Error",
          description: `Dropdown field "${field.label}" must have at least one option`,
          variant: "destructive",
        });
        return;
      }

      if (field.type === "dropdown") {
        for (const option of field.options) {
          if (!option.label.trim() || !option.value.trim()) {
            toast({
              title: "Error",
              description: `All options in "${field.label}" must have a label and value`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/form-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          eventId: eventId || null, // Make sure to pass eventId if available
          fields: fields.map((field, index) => ({
            ...field,
            order: index,
            options: field.options?.map((option: any, optionIndex: number) => ({
              ...option,
              order: optionIndex,
            }))
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create template");
      }

      toast({
        title: "Success",
        description: "Form template created successfully",
      });

      setTemplateName("");
      setTemplateDescription("");
      setFields([]);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Form Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateDescription">Description (Optional)</Label>
            <Textarea
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Enter template description"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Form Fields</h3>
              <Button onClick={addField} type="button" variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8 bg-muted/30 rounded-md">
                <p className="text-muted-foreground">No fields added. Click "Add Field" to get started.</p>
              </div>
            )}

            {fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="border rounded-md p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1 mr-4">
                    <Label>Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                      placeholder="Enter field label"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(fieldIndex)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateField(fieldIndex, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="input">Text Input</SelectItem>
                        <SelectItem value="paragraph">Paragraph Text</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Required</Label>
                    <div className="flex items-center pt-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(fieldIndex, { required: checked })}
                      />
                      <span className="ml-2 text-sm">{field.required ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Placeholder Text</Label>
                  <Input
                    value={field.placeholder || ""}
                    onChange={(e) => updateField(fieldIndex, { placeholder: e.target.value })}
                    placeholder="Enter placeholder text"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Help Text</Label>
                  <Input
                    value={field.helpText || ""}
                    onChange={(e) => updateField(fieldIndex, { helpText: e.target.value })}
                    placeholder="Enter help text"
                  />
                </div>

                {field.type === "dropdown" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(fieldIndex)}
                      >
                        <PlusCircle className="h-3 w-3 mr-2" />
                        Add Option
                      </Button>
                    </div>

                    {(!field.options || field.options.length === 0) && (
                      <div className="text-center py-4 bg-muted/30 rounded-md">
                        <p className="text-muted-foreground text-sm">No options added.</p>
                      </div>
                    )}

                    {field.options?.map((option: any, optionIndex: number) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <Input
                          value={option.label}
                          onChange={(e) =>
                            updateOption(fieldIndex, optionIndex, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                          }
                          placeholder="Option label"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(fieldIndex, optionIndex)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
