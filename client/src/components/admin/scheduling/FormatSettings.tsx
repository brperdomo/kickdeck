import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Download,
  Eye,
  Settings,
  Users,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { TemplatePreview } from './TemplatePreview';

interface Matchup {
  home: string;
  away: string;
  gameType?: string;
  round?: number;
}

interface MatchupTemplate {
  id: number;
  name: string;
  description: string;
  teamCount: number;
  bracketStructure: string;
  matchupPattern: string[][];
  totalGames: number;
  hasPlayoffGame: boolean;
  playoffDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormatSettingsProps {
  eventId: string;
}

export function FormatSettings({ eventId }: FormatSettingsProps) {
  const [editingTemplate, setEditingTemplate] = useState<MatchupTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamCount: 4,
    bracketStructure: 'single',
    matchups: [{ home: 'A1', away: 'A2' }] as Matchup[],
    hasPlayoffGame: false,
    playoffDescription: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all matchup templates
  const templatesQuery = useQuery({
    queryKey: ['matchup-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/matchup-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json() as Promise<MatchupTemplate[]>;
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await fetch('/api/admin/matchup-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateData.name,
          description: templateData.description,
          teamCount: templateData.teamCount,
          bracketStructure: templateData.bracketStructure,
          matchupPattern: templateData.matchups.map((m: Matchup) => [m.home, m.away]),
          totalGames: templateData.matchups.length + (templateData.hasPlayoffGame ? 1 : 0),
          hasPlayoffGame: templateData.hasPlayoffGame,
          playoffDescription: templateData.playoffDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchup-templates'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Matchup template created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'destructive',
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, templateData }: { id: number; templateData: any }) => {
      const response = await fetch(`/api/admin/matchup-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateData.name,
          description: templateData.description,
          teamCount: templateData.teamCount,
          bracketStructure: templateData.bracketStructure,
          matchupPattern: templateData.matchups.map((m: Matchup) => [m.home, m.away]),
          totalGames: templateData.matchups.length + (templateData.hasPlayoffGame ? 1 : 0),
          hasPlayoffGame: templateData.hasPlayoffGame,
          playoffDescription: templateData.playoffDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to update template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchup-templates'] });
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Matchup template updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/matchup-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to delete template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchup-templates'] });
      toast({
        title: 'Success',
        description: 'Matchup template deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });

  // Clone template mutation
  const cloneTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/matchup-templates/${id}/clone`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to clone template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchup-templates'] });
      toast({
        title: 'Success',
        description: 'Matchup template cloned successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clone template',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      teamCount: 4,
      bracketStructure: 'single',
      matchups: [{ home: 'A1', away: 'A2' }],
      hasPlayoffGame: false,
      playoffDescription: '',
    });
  };

  const addMatchup = () => {
    setFormData((prev) => ({
      ...prev,
      matchups: [...prev.matchups, { home: 'A1', away: 'B1' }],
    }));
  };

  const removeMatchup = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      matchups: prev.matchups.filter((_, i) => i !== index),
    }));
  };

  const updateMatchup = (index: number, field: 'home' | 'away', value: string) => {
    setFormData((prev) => ({
      ...prev,
      matchups: prev.matchups.map((matchup, i) =>
        i === index ? { ...matchup, [field]: value } : matchup
      ),
    }));
  };

  const handleEdit = (template: MatchupTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      teamCount: template.teamCount,
      bracketStructure: template.bracketStructure,
      matchups: template.matchupPattern.map(([home, away]) => ({ home, away })),
      hasPlayoffGame: template.hasPlayoffGame,
      playoffDescription: template.playoffDescription || '',
    });
    setIsEditModalOpen(true);
  };

  const exportTemplate = (template: MatchupTemplate) => {
    const exportData = {
      templateName: template.name,
      matchups: template.matchupPattern.map(([home, away]) => ({ home, away })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${template.name.replace(/[^a-z0-9]/gi, '_')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getBracketTypeIcon = (structure: string) => {
    switch (structure) {
      case 'single':
        return <Trophy className="h-4 w-4" />;
      case 'dual':
        return <Users className="h-4 w-4" />;
      case 'crossover':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getBracketTypeColor = (structure: string) => {
    switch (structure) {
      case 'single':
        return 'bg-blue-100 text-blue-800';
      case 'dual':
        return 'bg-green-100 text-green-800';
      case 'crossover':
        return 'bg-purple-100 text-purple-800';
      case 'round_robin':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (templatesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading format templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Format Settings</h2>
          <p className="text-muted-foreground">
            Define matchup patterns for tournament scheduling
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Matchup Template</DialogTitle>
              <DialogDescription>
                Define how teams will be matched up in this tournament format
              </DialogDescription>
            </DialogHeader>
            <CreateEditTemplateForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => createTemplateMutation.mutate(formData)}
              isLoading={createTemplateMutation.isPending}
              addMatchup={addMatchup}
              removeMatchup={removeMatchup}
              updateMatchup={updateMatchup}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templatesQuery.data?.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={getBracketTypeColor(template.bracketStructure)}
                  >
                    {getBracketTypeIcon(template.bracketStructure)}
                    <span className="ml-1 capitalize">
                      {template.bracketStructure.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Stats */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-lg">{template.teamCount}</div>
                  <div className="text-muted-foreground">Teams</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{template.totalGames}</div>
                  <div className="text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">
                    {template.hasPlayoffGame ? 'Yes' : 'No'}
                  </div>
                  <div className="text-muted-foreground">Final</div>
                </div>
              </div>

              <Separator />

              {/* Matchup Preview */}
              <div>
                <div className="text-sm font-medium mb-2">Matchup Pattern:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {template.matchupPattern.slice(0, 5).map(([home, away], idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1"
                    >
                      <span className="font-mono">{home}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="font-mono">{away}</span>
                    </div>
                  ))}
                  {template.matchupPattern.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{template.matchupPattern.length - 5} more...
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <TemplatePreview template={template} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cloneTemplateMutation.mutate(template.id)}
                  disabled={cloneTemplateMutation.isPending}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Clone
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportTemplate(template)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{template.name}"? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Matchup Template</DialogTitle>
            <DialogDescription>
              Modify the matchup pattern for this tournament format
            </DialogDescription>
          </DialogHeader>
          <CreateEditTemplateForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={() =>
              editingTemplate &&
              updateTemplateMutation.mutate({
                id: editingTemplate.id,
                templateData: formData,
              })
            }
            isLoading={updateTemplateMutation.isPending}
            addMatchup={addMatchup}
            removeMatchup={removeMatchup}
            updateMatchup={updateMatchup}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form component for creating/editing templates
interface CreateEditTemplateFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  addMatchup: () => void;
  removeMatchup: (index: number) => void;
  updateMatchup: (index: number, field: 'home' | 'away', value: string) => void;
}

function CreateEditTemplateForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  addMatchup,
  removeMatchup,
  updateMatchup,
}: CreateEditTemplateFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., 6-Team Crossplay Format"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe this tournament format..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="teamCount">Team Count</Label>
            <Input
              id="teamCount"
              type="number"
              min="2"
              max="16"
              value={formData.teamCount}
              onChange={(e) =>
                setFormData({ ...formData, teamCount: parseInt(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="bracketStructure">Bracket Structure</Label>
            <Select
              value={formData.bracketStructure}
              onValueChange={(value) =>
                setFormData({ ...formData, bracketStructure: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Bracket</SelectItem>
                <SelectItem value="dual">Dual Brackets (Separate pools + championship)</SelectItem>
                <SelectItem value="crossover">Crossplay (Pool A vs Pool B throughout)</SelectItem>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="swiss">Swiss System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Matchups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Matchups</Label>
          <Button type="button" variant="outline" size="sm" onClick={addMatchup}>
            <Plus className="h-3 w-3 mr-1" />
            Add Matchup
          </Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {formData.matchups.map((matchup: Matchup, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="A1"
                value={matchup.home}
                onChange={(e) => updateMatchup(index, 'home', e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground">vs</span>
              <Input
                placeholder="B1"
                value={matchup.away}
                onChange={(e) => updateMatchup(index, 'away', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeMatchup(index)}
                disabled={formData.matchups.length === 1}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Playoff Game */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hasPlayoffGame"
            checked={formData.hasPlayoffGame}
            onChange={(e) =>
              setFormData({ ...formData, hasPlayoffGame: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="hasPlayoffGame">Include Championship/Final Game</Label>
        </div>
        {formData.hasPlayoffGame && (
          <div>
            <Label htmlFor="playoffDescription">Final Game Description</Label>
            <Textarea
              id="playoffDescription"
              value={formData.playoffDescription}
              onChange={(e) =>
                setFormData({ ...formData, playoffDescription: e.target.value })
              }
              placeholder="e.g., Top 2 teams by points play in final..."
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isLoading || !formData.name}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Saving...' : 'Save Template'}
        </Button>
      </DialogFooter>
    </div>
  );
}