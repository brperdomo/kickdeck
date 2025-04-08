import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormTemplateEditor } from "@/components/admin/FormTemplateEditor";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Import the types from the FormTemplateEditor component
interface FormFieldOption {
  label: string;
  value: string;
}

interface FormFieldType {
  id?: string | number;
  type: string;
  label: string;
  required: boolean;
  order: number;
  placeholder: string;
  helpText: string;
  options: FormFieldOption[];
  validation?: any;
}

interface FormTemplateType {
  id: string | number | null;
  eventId?: string | number | null;
  name: string;
  description: string;
  isPublished: boolean;
  fields: FormFieldType[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export default function FormTemplateEditPage() {
  const [, params] = useRoute("/admin/form-templates/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [template, setTemplate] = useState<FormTemplateType | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["form-template", params?.id],
    queryFn: async () => {
      console.log(`Fetching template with ID: ${params?.id}`);
      const response = await fetch(`/api/admin/form-templates/${params?.id}`);
      if (!response.ok) {
        console.error(`Error fetching template: ${response.status} ${response.statusText}`);
        throw new Error("Failed to fetch template");
      }
      const data = await response.json();
      console.log("Template data received:", JSON.stringify(data, null, 2));
      console.log("Template fields:", JSON.stringify(data.fields, null, 2));
      return data;
    },
    enabled: !!params?.id,
    staleTime: 0 // Always fetch fresh data
  });

  useEffect(() => {
    if (data) {
      console.log("Setting template from data:", JSON.stringify(data, null, 2));
      console.log("Template fields count:", data.fields?.length || 0);
      console.log("Template first field:", data.fields?.[0] ? JSON.stringify(data.fields[0], null, 2) : "No fields");
      
      // Use a key-by-key approach to ensure all data is properly transferred
      // This helps avoid any reference issues that might be causing the problem
      const sanitizedTemplate = {
        id: data.id,
        eventId: data.eventId,
        name: data.name || "",
        description: data.description || "",
        isPublished: Boolean(data.isPublished),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        fields: Array.isArray(data.fields) ? data.fields.map((field: any) => ({
          id: field.id,
          label: field.label || "",
          type: field.type || "text",  // Map input to text type here
          required: Boolean(field.required),
          order: field.order || 0,
          placeholder: field.placeholder || "",
          helpText: field.helpText || "",
          validation: field.validation,
          options: field.options || []
        })) : []
      };
      
      console.log("Sanitized template for FormTemplateEditor:", JSON.stringify(sanitizedTemplate, null, 2));
      setTemplate(sanitizedTemplate);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load template. Redirecting to dashboard.",
        variant: "destructive"
      });
      navigate("/admin");
    }
  }, [error, navigate, toast]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="outline" className="mr-4" onClick={() => navigate("/admin")}>
            <ArrowLeft size={16} className="mr-1" /> Back to Admin Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Loading Template...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded mb-6 w-3/4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="outline" className="mr-4" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Admin Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Edit Form Template</h1>
      </div>
      <FormTemplateEditor editMode={true} existingTemplate={template} />
    </div>
  );
}