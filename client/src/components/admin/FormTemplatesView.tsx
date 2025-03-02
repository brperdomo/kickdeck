
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Plus, Trash } from "lucide-react";

interface FormTemplate {
  id: number;
  name: string;
  description: string;
  isPublished: boolean;
  eventId?: number;
  eventName?: string;
  fields: any[];
  createdAt: string;
  updatedAt: string;
}

export function FormTemplatesView() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['form-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/form-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const templates = await response.json();
      return templates.map((template: any) => ({
        ...template,
        eventName: template.eventId ? 'Event Specific' : 'Global Template'
      }));
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
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (templatesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Form Templates</h2>
        <Button onClick={() => navigate("/admin/form-templates/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No form templates found. Create your first template to get started.
                  </TableCell>
                </TableRow>
              ) : (
                templatesQuery.data?.map((template: FormTemplate) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.description}</TableCell>
                    <TableCell>{template.eventName || 'Global Template'}</TableCell>
                    <TableCell>{template.isPublished ? 'Published' : 'Draft'}</TableCell>
                    <TableCell>{template.fields?.length || 0} fields</TableCell>
                    <TableCell>{new Date(template.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/form-templates/${template.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this template?')) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
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
    </>
  );
}
