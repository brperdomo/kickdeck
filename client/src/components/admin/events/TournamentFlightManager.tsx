import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Edit2, Trash2, Target, Settings, 
  CheckCircle, Info, AlertTriangle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface TournamentFlightManagerProps {
  eventId: string;
}

interface FlightTemplate {
  id: number;
  event_id: string;
  level: string;
  display_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface FlightFormData {
  level: string;
  displayName: string;
  description: string;
  sortOrder: number;
}

export function TournamentFlightManager({ eventId }: TournamentFlightManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FlightTemplate | null>(null);
  const [formData, setFormData] = useState<FlightFormData>({
    level: "",
    displayName: "",
    description: "",
    sortOrder: 0
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch flight templates
  const {
    data: flightTemplates = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["flight-templates", eventId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/events/${eventId}/flight-templates`);
      return data;
    },
    enabled: !!eventId,
  });

  // Initialize default templates mutation
  const initializeDefaultsMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/admin/events/${eventId}/flight-templates/initialize-defaults`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flight-templates", eventId] });
      toast.success("Default flight templates created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to initialize defaults: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Create flight template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: FlightFormData) => {
      const response = await axios.post(`/api/admin/events/${eventId}/flight-templates`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flight-templates", eventId] });
      toast.success("Flight template created and applied to all age groups");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create flight template: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Update flight template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FlightFormData }) => {
      const response = await axios.put(`/api/admin/events/${eventId}/flight-templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flight-templates", eventId] });
      toast.success("Flight template updated across all age groups");
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast.error(`Failed to update flight template: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Delete flight template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/admin/events/${eventId}/flight-templates/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flight-templates", eventId] });
      toast.success("Flight template removed");
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete flight template: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'sortOrder' ? parseInt(value) || 0 : value 
    }));
  };

  const resetForm = () => {
    setFormData({
      level: "",
      displayName: "",
      description: "",
      sortOrder: 0
    });
  };

  const handleCreate = () => {
    if (!formData.level || !formData.displayName) {
      toast.error("Level and display name are required");
      return;
    }
    createTemplateMutation.mutate(formData);
  };

  const handleEdit = (template: FlightTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      level: template.level,
      displayName: template.display_name,
      description: template.description || "",
      sortOrder: template.sort_order
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedTemplate || !formData.level || !formData.displayName) {
      toast.error("Level and display name are required");
      return;
    }
    updateTemplateMutation.mutate({ id: selectedTemplate.id, data: formData });
  };

  const handleDelete = (template: FlightTemplate) => {
    if (confirm(`Are you sure you want to remove the "${template.display_name}" flight template?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading flight templates...</div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load flight templates. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Tournament Flight Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure flight categories that apply to all age groups in this tournament.
          Changes made here will update all existing brackets across all age groups.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flightTemplates.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No flight templates configured for this tournament.
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2"
                  onClick={() => initializeDefaultsMutation.mutate()}
                  disabled={initializeDefaultsMutation.isPending}
                >
                  Initialize default templates
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-sm">
                  {flightTemplates.length} flight categories configured
                </Badge>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Flight Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Flight Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="level">Level Code</Label>
                        <Input
                          id="level"
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          placeholder="e.g., top_flight, middle_flight"
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleInputChange}
                          placeholder="e.g., Top Flight, Premier Division"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Description of this flight level"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input
                          id="sortOrder"
                          name="sortOrder"
                          type="number"
                          value={formData.sortOrder}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreate}
                          disabled={createTemplateMutation.isPending}
                        >
                          Create & Apply to All Age Groups
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Level Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flightTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.display_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{template.level}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {template.description || "No description"}
                      </TableCell>
                      <TableCell>{template.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Flight Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-level">Level Code</Label>
                <Input
                  id="edit-level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  placeholder="e.g., top_flight, middle_flight"
                />
              </div>
              <div>
                <Label htmlFor="edit-displayName">Display Name</Label>
                <Input
                  id="edit-displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g., Top Flight, Premier Division"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description of this flight level"
                />
              </div>
              <div>
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input
                  id="edit-sortOrder"
                  name="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Changes will be applied to all existing brackets using this flight category across all age groups.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updateTemplateMutation.isPending}
                >
                  Update All Age Groups
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}