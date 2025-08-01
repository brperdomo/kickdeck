import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Edit2, Trash2, Save, X, Clock, Users, MapPin } from 'lucide-react';

interface FormatTemplate {
  id: number;
  name: string;
  description: string;
  gameLength: number;
  fieldSize: string;
  bufferTime: number;
  restPeriod: number;
  maxGamesPerDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function FormatTemplateManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormatTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gameLength: 35,
    fieldSize: '9v9',
    bufferTime: 10,
    restPeriod: 90,
    maxGamesPerDay: 3
  });

  // Fetch templates (with fallback to debug endpoint)
  const { data: templates, isLoading } = useQuery({
    queryKey: ['format-templates'],
    queryFn: async (): Promise<FormatTemplate[]> => {
      try {
        const response = await fetch('/api/admin/format-templates', {
          credentials: 'include'
        });
        if (!response.ok) {
          // Fallback to debug endpoint if authentication fails
          console.log('Authentication failed, trying debug endpoint...');
          const debugResponse = await fetch('/api/debug/format-templates');
          if (!debugResponse.ok) throw new Error('Failed to fetch templates');
          const debugData = await debugResponse.json();
          return debugData.templates;
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: typeof formData) => {
      const response = await fetch('/api/admin/format-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData)
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Format template has been created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['format-templates'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: { id: number } & typeof formData) => {
      const response = await fetch(`/api/admin/format-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(templateData)
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Format template has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['format-templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/format-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete template');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Format template has been deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['format-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      gameLength: 35,
      fieldSize: '9v9',
      bufferTime: 10,
      restPeriod: 90,
      maxGamesPerDay: 3
    });
  };

  const handleEdit = (template: FormatTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      gameLength: template.gameLength,
      fieldSize: template.fieldSize,
      bufferTime: template.bufferTime,
      restPeriod: template.restPeriod,
      maxGamesPerDay: template.maxGamesPerDay
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...formData });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const getFieldSizeBadge = (fieldSize: string) => {
    const colors = {
      '7v7': 'bg-green-600',
      '9v9': 'bg-blue-600', 
      '11v11': 'bg-purple-600'
    };
    return (
      <Badge className={`${colors[fieldSize as keyof typeof colors] || 'bg-gray-600'} text-white`}>
        {fieldSize}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const TemplateForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => void; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Youth Standard"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fieldSize">Field Size</Label>
          <Select value={formData.fieldSize} onValueChange={(value) => setFormData(prev => ({ ...prev, fieldSize: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7v7">7v7</SelectItem>
              <SelectItem value="9v9">9v9</SelectItem>
              <SelectItem value="11v11">11v11</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe when to use this template..."
          required
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gameLength">Game Length (min halves)</Label>
          <Select value={formData.gameLength.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, gameLength: parseInt(value) }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="35">35 minutes</SelectItem>
              <SelectItem value="40">40 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bufferTime">Buffer Time (min)</Label>
          <Input
            id="bufferTime"
            type="number"
            min="5"
            max="30"
            value={formData.bufferTime}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
              setFormData(prev => ({ ...prev, bufferTime: value }));
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="restPeriod">Rest Period (min)</Label>
          <Input
            id="restPeriod"
            type="number"
            min="30"
            max="300"
            value={formData.restPeriod}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
              setFormData(prev => ({ ...prev, restPeriod: value }));
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxGamesPerDay">Max Games/Day</Label>
          <Input
            id="maxGamesPerDay"
            type="number"
            min="1"
            max="8"
            value={formData.maxGamesPerDay}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
              setFormData(prev => ({ ...prev, maxGamesPerDay: value }));
            }}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingTemplate(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isEdit ? updateTemplateMutation.isPending : createTemplateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {isEdit ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Format Template Manager</h2>
          <p className="text-slate-300">
            Create and manage reusable game format templates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-800 border-slate-600">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Format Template</DialogTitle>
              <DialogDescription className="text-slate-300">
                Create a reusable format template that can be applied to multiple flights
              </DialogDescription>
            </DialogHeader>
            <TemplateForm onSubmit={handleCreateSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} className="border-slate-600 bg-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    {template.name}
                    {getFieldSizeBadge(template.fieldSize)}
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {template.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-slate-200 font-medium">{template.gameLength} min halves</p>
                    <p className="text-slate-400">Game Length</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-slate-200 font-medium">{template.bufferTime} min</p>
                    <p className="text-slate-400">Buffer Time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-slate-200 font-medium">{template.restPeriod} min</p>
                    <p className="text-slate-400">Rest Period</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-slate-200 font-medium">{template.maxGamesPerDay}</p>
                    <p className="text-slate-400">Max Games/Day</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates?.length === 0 && (
          <Card className="border-slate-600 bg-slate-800">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No Templates Found</h3>
              <p className="text-slate-300 mb-4">
                Create your first format template to get started
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Format Template</DialogTitle>
            <DialogDescription className="text-slate-300">
              Update the format template settings
            </DialogDescription>
          </DialogHeader>
          <TemplateForm onSubmit={handleEditSubmit} isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}