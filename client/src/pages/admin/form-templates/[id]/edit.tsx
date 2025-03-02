
import React from "react";
import { FormTemplateEditor } from "@/components/admin/FormTemplateEditor";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useParams } from "wouter";

export default function EditFormTemplatePage() {
  const { id } = useParams();
  
  return (
    <AdminLayout>
      <FormTemplateEditor id={id} />
    </AdminLayout>
  );
}
