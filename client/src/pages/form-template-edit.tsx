
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormTemplateEditor } from "@/components/admin/FormTemplateEditor";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useLocation, useRoute } from "wouter";

export default function FormTemplateEditPage() {
  const [, params] = useRoute("/admin/form-templates/:id/edit");
  const [, navigate] = useLocation();
  const [template, setTemplate] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["form-template", params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/form-templates/${params?.id}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      return response.json();
    },
    enabled: !!params?.id
  });

  useEffect(() => {
    if (data) {
      setTemplate(data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      navigate("/admin/form-templates");
    }
  }, [error, navigate]);

  if (isLoading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <FormTemplateEditor editMode={true} existingTemplate={template} />
    </AdminLayout>
  );
}
