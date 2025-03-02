
import React from "react";
import { FormTemplateEditor } from "@/components/admin/FormTemplateEditor";
import { AdminLayout } from "@/components/layouts/admin-layout";

export default function CreateFormTemplatePage() {
  return (
    <AdminLayout>
      <FormTemplateEditor />
    </AdminLayout>
  );
}
