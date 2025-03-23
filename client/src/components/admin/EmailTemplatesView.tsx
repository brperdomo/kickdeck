
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Eye, MoreHorizontal, Copy } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { EmailTemplate } from "@db/schema/emailTemplates";

interface EmailTemplatesViewProps {
  isEmbedded?: boolean;
}

export function EmailTemplatesView({ isEmbedded = false }: EmailTemplatesViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const templatesQuery = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) throw new Error('Failed to fetch email templates');
      return response.json() as Promise<EmailTemplate[]>;
    }
  });

  const handleEdit = (template: EmailTemplate) => {
    navigate(`/admin/email-templates/${template.id}`);
  };

  const handleCreate = () => {
    navigate('/admin/email-templates/create');
  };

  const handlePreview = (template: EmailTemplate) => {
    try {
      // Clean and prepare the template data
      const cleanedData = {
        ...template,
        description: template.description || "",
        isActive: template.isActive === false ? false : true,
        variables: template.variables || [],
        providerId: template.providerId ? Number(template.providerId) : null
      };
      
      console.log("Preparing preview with data:", cleanedData);
      // Encode the entire template object to pass as query parameter
      const encodedData = encodeURIComponent(JSON.stringify(cleanedData));
      const url = `/api/admin/email-templates/preview?template=${encodedData}`;
      console.log("Preview URL length:", url.length);
      console.log("Preview URL (truncated):", url.substring(0, 100) + "...");
      
      // Use POST method instead of GET to handle large template data
      const win = window.open('about:blank', '_blank');
      
      if (!win) {
        toast({
          title: "Preview blocked",
          description: "Please allow popups for this site to use the preview feature.",
          variant: "destructive"
        });
        return;
      }
      
      // Create a form to submit the data via POST
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/admin/email-templates/preview';
      form.target = '_blank';
      
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'template';
      input.value = JSON.stringify(cleanedData);
      
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (e) {
      console.error("Failed to generate preview:", e);
      toast({
        title: "Preview error",
        description: "Could not generate preview. Check console for details.",
        variant: "destructive"
      });
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const { id, createdAt, updatedAt, ...templateData } = template;
      templateData.name = `${templateData.name} (Copy)`;
      
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) throw new Error("Failed to duplicate template");
      
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Template Duplicated",
        description: "A copy of the template has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (templatesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {!isEmbedded && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      )}
      {isEmbedded && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Email Templates</h3>
          <Button onClick={handleCreate} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      )}

      {isEmbedded ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.data?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {template.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreview(template)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesQuery.data?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {template.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.subject}</TableCell>
                    <TableCell>{template.senderName}</TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'Not modified'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreview(template)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isEmbedded && (
        <div className="mt-4 text-center">
          <Button variant="link" asChild className="text-primary">
            <Link href="/admin/email-templates">
              View All Templates
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
