
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">Form Templates</h2>
        <Button 
          onClick={handleCreateTemplate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card className="shadow-md rounded-xl overflow-hidden border border-gray-200">
        <CardContent className="p-0">
          <div className="rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                  <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Name</TableHead>
                  <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Description</TableHead>
                  <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Status</TableHead>
                  <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Fields</TableHead>
                  <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Created</TableHead>
                  <TableHead className="w-[80px] font-semibold py-4 text-indigo-900 dark:text-blue-100 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesQuery.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No templates found. Create your first template.
                    </TableCell>
                  </TableRow>
                ) : (
                  templatesQuery.data.map((template: FormTemplate, index: number) => (
                    <TableRow 
                      key={template.id}
                      className={`
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} 
                        hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors
                      `}
                    >
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.description || "-"}</TableCell>
                      <TableCell>
                        <span className={`
                          px-3 py-1 text-xs font-medium shadow-sm rounded-full
                          ${template.isPublished 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200" 
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200"}
                        `}>
                          {template.isPublished ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell>{template.fields?.length || 0} fields</TableCell>
                      <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[160px] shadow-lg">
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
          </div>
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
