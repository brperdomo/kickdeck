import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MoreHorizontal, 
  Plus, 
  Edit, 
  Trash, 
  Download, 
  History, 
  Users, 
  FileText,
  Eye,
  Settings,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Target
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { FormFieldOptionsEditor } from "./FormFieldOptionsEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EnhancedFormTemplate {
  id: number;
  eventId?: number;
  name: string;
  description: string;
  isPublished: boolean;
  version: number;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: number;
    name: string;
  } | null;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  fieldCount: number;
  teamUsageCount: number;
  fields: any[];
}

interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface AuditLog {
  id: number;
  action: string;
  changeDetails: any;
  affectedTeamCount: number;
  createdAt: string;
  performedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface TemplateUsage {
  teamCount: number;
  responseCount: number;
  versions: number[];
}

interface FormField {
  id?: number;
  fieldId: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'email' | 'phone' | 'date';
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  validation?: any;
  options?: Array<{
    label: string;
    value: string;
    order: number;
  }>;
}

const generateFieldId = (label: string) => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
};

export function EnhancedFormTemplateManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedFormTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [templateForm, setTemplateForm] = useState<{
    name: string;
    description: string;
    isPublished: boolean;
    eventId?: number;
    fields: FormField[];
  }>({
    name: '',
    description: '',
    isPublished: false,
    eventId: undefined,
    fields: []
  });

  // Fetch enhanced templates
  const templatesQuery = useQuery({
    queryKey: ['enhanced-form-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/enhanced-form-templates');
      if (!response.ok) throw new Error('Failed to fetch enhanced templates');
      return response.json() as Promise<EnhancedFormTemplate[]>;
    }
  });

  // Fetch events for assignment
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      return data.events as Event[];
    }
  });

  // Fetch audit logs for selected template
  const auditLogsQuery = useQuery({
    queryKey: ['template-audit-logs', selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate?.id) return [];
      const response = await fetch(`/api/admin/form-templates/${selectedTemplate.id}/audit-logs`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json() as Promise<AuditLog[]>;
    },
    enabled: !!selectedTemplate?.id
  });

  // Fetch usage statistics for selected template
  const usageQuery = useQuery({
    queryKey: ['template-usage', selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate?.id) return { teamCount: 0, responseCount: 0, versions: [] };
      const response = await fetch(`/api/admin/form-templates/${selectedTemplate.id}/usage`);
      if (!response.ok) throw new Error('Failed to fetch usage statistics');
      return response.json() as Promise<TemplateUsage>;
    },
    enabled: !!selectedTemplate?.id
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof templateForm) => {
      // Ensure all fields have valid fieldIds before submission
      const processedData = {
        ...templateData,
        fields: templateData.fields.map((field, index) => ({
          ...field,
          fieldId: field.fieldId || generateFieldId(field.label) || `field_${index}`
        }))
      };

      const response = await fetch('/api/admin/enhanced-form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData)
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-form-templates'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Template created successfully"
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

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: { id: number } & typeof templateForm) => {
      // Ensure all fields have valid fieldIds before submission
      const processedData = {
        ...templateData,
        fields: templateData.fields.map((field, index) => ({
          ...field,
          fieldId: field.fieldId || generateFieldId(field.label) || `field_${index}`
        }))
      };

      const response = await fetch(`/api/admin/enhanced-form-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData)
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-form-templates'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Template updated successfully"
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

  // Assign to event mutation
  const assignToEventMutation = useMutation({
    mutationFn: async ({ templateId, eventId }: { templateId: number; eventId: number }) => {
      const response = await fetch(`/api/admin/enhanced-form-templates/${templateId}/assign-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (!response.ok) throw new Error('Failed to assign template to event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-form-templates'] });
      setIsAssignDialogOpen(false);
      toast({
        title: "Success",
        description: "Template assigned to event successfully"
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

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/admin/form-templates/${templateId}/export-data`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }
      
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'form-data.csv';
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data exported successfully"
      });
    }
  });

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      isPublished: false,
      eventId: undefined,
      fields: []
    });
  };



  const addField = () => {
    const newField: FormField = {
      fieldId: '',
      label: '',
      type: 'text',
      required: false,
      order: templateForm.fields.length,
      placeholder: '',
      helpText: '',
      options: []
    };
    setTemplateForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => {
        if (i === index) {
          const updated = { ...field, ...updates };
          // Auto-generate fieldId when label changes
          if (updates.label && updates.label !== field.label) {
            updated.fieldId = generateFieldId(updates.label);
          }
          // Ensure fieldId is never empty
          if (!updated.fieldId && updated.label) {
            updated.fieldId = generateFieldId(updated.label);
          }
          return updated;
        }
        return field;
      })
    }));
  };

  const removeField = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const addOption = (fieldIndex: number) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: [...(field.options || []), { label: "", value: "", order: (field.options?.length || 0) }]
            }
          : field
      )
    }));
  };

  const updateOption = (fieldIndex: number, optionIndex: number, updates: any) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: field.options?.map((option, j) => 
                j === optionIndex ? { ...option, ...updates } : option
              ) || []
            }
          : field
      )
    }));
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex
          ? {
              ...field,
              options: field.options?.filter((_, j) => j !== optionIndex) || []
            }
          : field
      )
    }));
  };

  const templates = templatesQuery.data || [];
  
  const filteredTemplates = useMemo(() => {
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.event?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const handleEdit = (template: EnhancedFormTemplate) => {
    setTemplateForm({
      name: template.name,
      description: template.description,
      isPublished: template.isPublished,
      fields: template.fields.map(field => ({
        ...field,
        options: field.options || []
      }))
    });
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (template: EnhancedFormTemplate) => {
    if (!template.isActive) return "bg-gray-100 text-gray-800";
    if (template.isPublished && template.eventId) return "bg-green-100 text-green-800";
    if (template.isPublished) return "bg-blue-100 text-blue-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (template: EnhancedFormTemplate) => {
    if (!template.isActive) return "Inactive";
    if (template.isPublished && template.eventId) return "Active";
    if (template.isPublished) return "Published";
    return "Draft";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Form Templates</h2>
          <p className="text-muted-foreground">
            Create and manage custom form templates for event registrations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.description || "No description"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.event ? (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{template.event.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{template.fieldCount} fields</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{template.teamUsageCount} teams</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{template.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(template)}>
                          {getStatusText(template)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsAssignDialogOpen(true);
                              }}
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Assign to Event
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTemplate(template);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => exportDataMutation.mutate(template.id)}
                              disabled={template.teamUsageCount === 0}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export Data
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No templates found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {selectedTemplate ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usageQuery.data && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{usageQuery.data.teamCount}</div>
                          <div className="text-sm text-muted-foreground">Teams Using Template</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{usageQuery.data.responseCount}</div>
                          <div className="text-sm text-muted-foreground">Form Responses</div>
                        </div>
                      </div>
                      {usageQuery.data.versions.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Version Usage</div>
                          <div className="flex gap-2 flex-wrap">
                            {usageQuery.data.versions.map(version => (
                              <Badge key={version} variant="outline">v{version}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {auditLogsQuery.data?.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 pb-3 mb-3 border-b last:border-b-0">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.performedBy ? 
                              `${log.performedBy.firstName} ${log.performedBy.lastName}` : 
                              'System'
                            } • {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          {log.affectedTeamCount > 0 && (
                            <div className="text-xs text-orange-600">
                              Affects {log.affectedTeamCount} teams
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {auditLogsQuery.data?.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No audit logs available
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Template</h3>
                <p className="text-muted-foreground">
                  Choose a template from the overview tab to view detailed analytics and audit logs.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create New Form Template</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="published">Published</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={templateForm.isPublished}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isPublished: checked }))}
                    />
                    <Label htmlFor="published">
                      {templateForm.isPublished ? 'Published' : 'Draft'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventId">Assign to Event (Optional)</Label>
                {eventsQuery.isLoading ? (
                  <div className="flex items-center space-x-2 p-2 border rounded">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading events...</span>
                  </div>
                ) : eventsQuery.error ? (
                  <div className="text-red-500 text-sm p-2 border border-red-200 rounded">
                    Error loading events: {eventsQuery.error.message}
                  </div>
                ) : (
                  <Select
                    value={templateForm.eventId?.toString() || "none"}
                    onValueChange={(value) => setTemplateForm(prev => ({ 
                      ...prev, 
                      eventId: value === "none" ? undefined : parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific event</SelectItem>
                      {eventsQuery.data?.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {eventsQuery.data && (
                  <p className="text-xs text-muted-foreground">
                    Found {eventsQuery.data.length} events available for assignment
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium">Form Fields</h4>
                  <Button onClick={addField} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {templateForm.fields.map((field, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Enter field label..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field ID</Label>
                        <Input
                          value={field.fieldId}
                          onChange={(e) => updateField(index, { fieldId: e.target.value })}
                          placeholder="Auto-generated..."
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(index, { type: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Required</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked })}
                          />
                          <Label>{field.required ? 'Required' : 'Optional'}</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Enter placeholder text..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Help Text</Label>
                        <Input
                          value={field.helpText || ''}
                          onChange={(e) => updateField(index, { helpText: e.target.value })}
                          placeholder="Enter help text..."
                        />
                      </div>
                    </div>

                    {/* Options for select, checkbox, and radio fields - CREATE DIALOG */}
                    {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                      <div className="mt-4">
                        <FormFieldOptionsEditor
                          options={field.options || []}
                          onOptionsChange={(options) => updateField(index, { options })}
                        />
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={() => removeField(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Remove Field
                      </Button>
                    </div>
                  </Card>
                ))}

                {templateForm.fields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No fields added yet. Click "Add Field" to get started.
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createTemplateMutation.mutate(templateForm)}
              disabled={!templateForm.name || createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Form Template</DialogTitle>
            {selectedTemplate && selectedTemplate.teamUsageCount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This template is used by {selectedTemplate.teamUsageCount} teams. 
                  Changes will create a new version and may affect existing registrations.
                </AlertDescription>
              </Alert>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-published">Published</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-published"
                      checked={templateForm.isPublished}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isPublished: checked }))}
                    />
                    <Label htmlFor="edit-published">
                      {templateForm.isPublished ? 'Published' : 'Draft'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description..."
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium">Form Fields</h4>
                  <Button onClick={addField} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {templateForm.fields.map((field, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Field Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Enter field label..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field ID</Label>
                        <Input
                          value={field.fieldId}
                          onChange={(e) => updateField(index, { fieldId: e.target.value })}
                          placeholder="Auto-generated..."
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(index, { type: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Required</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked })}
                          />
                          <Label>{field.required ? 'Required' : 'Optional'}</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Enter placeholder text..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Help Text</Label>
                        <Input
                          value={field.helpText || ''}
                          onChange={(e) => updateField(index, { helpText: e.target.value })}
                          placeholder="Enter help text..."
                        />
                      </div>
                    </div>

                    {/* Options for select, checkbox, and radio fields - EDIT DIALOG */}
                    {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                      <div className="mt-4">
                        <FormFieldOptionsEditor
                          options={field.options || []}
                          onOptionsChange={(options) => updateField(index, { options })}
                        />
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={() => removeField(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Remove Field
                      </Button>
                    </div>
                  </Card>
                ))}

                {templateForm.fields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No fields added yet. Click "Add Field" to get started.
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTemplate && updateTemplateMutation.mutate({ 
                id: selectedTemplate.id, 
                ...templateForm 
              })}
              disabled={!templateForm.name || updateTemplateMutation.isPending}
            >
              {updateTemplateMutation.isPending ? 'Updating...' : 'Update Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign to Event Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Template to Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Event</Label>
              <Select onValueChange={(value) => {
                if (selectedTemplate) {
                  assignToEventMutation.mutate({
                    templateId: selectedTemplate.id,
                    eventId: parseInt(value)
                  });
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {eventsQuery.data?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}