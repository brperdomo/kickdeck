
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Plus, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import { FormTemplateModal } from "./FormTemplateModal";

interface FormTemplate {
  id: number;
  name: string;
  description: string;
  isPublished: boolean;
  fields: any[];
  createdAt: string;
  updatedAt: string;
}

export function FormTemplatesView() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const templatesQuery = useQuery({
    queryKey: ['form-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/form-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const templates = await response.json();
      return templates;
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/form-templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['form-templates']);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete template"
      });
    }
  });

  const handleCreateTemplate = () => {
    setIsModalOpen(true);
  };

  const handleEditTemplate = (id: number) => {
    navigate(`/admin/form-templates/${id}/edit`);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  if (templatesQuery.isLoading) {
    return <div>Loading templates...</div>;
  }

  if (templatesQuery.isError) {
    return <div>Error loading templates: {(templatesQuery.error as Error).message}</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Form Templates</h2>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No templates found. Create your first template.
                  </TableCell>
                </TableRow>
              ) : (
                templatesQuery.data.map((template: FormTemplate) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.description || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${template.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {template.isPublished ? "Published" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell>{template.fields?.length || 0} fields</TableCell>
                    <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FormTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          queryClient.invalidateQueries(['form-templates']);
        }}
      />
    </>
  );
}
