import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, GripVertical, Settings, Trophy, Calculator } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ScoringRule {
  name: string;
  value: number | string;
  description?: string;
}

interface ScoringRuleTemplate {
  id: number;
  name: string;
  description: string;
  scoringRules: Record<string, number | string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StandingsCriteriaTemplate {
  id: number;
  name: string;
  description: string;
  standingsCriteria: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventScoringConfiguration {
  id: number;
  eventId: string;
  scoringRuleTemplateId?: number;
  standingsCriteriaTemplateId?: number;
  includeChampionship: boolean;
  championshipFormat?: string;
  customScoringRules?: Record<string, number | string>;
  customStandingsCriteria?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScoringStandingsSettingsProps {
  eventId: string;
}

const scoringRuleSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  scoringRules: z.record(z.union([z.number(), z.string()])),
});

const standingsCriteriaSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  standingsCriteria: z.array(z.string()).min(1, 'At least one criteria is required'),
});

const eventConfigurationSchema = z.object({
  eventId: z.string().min(1),
  scoringRuleTemplateId: z.number().optional(),
  standingsCriteriaTemplateId: z.number().optional(),
  includeChampionship: z.boolean().default(false),
  championshipFormat: z.string().optional(),
  customScoringRules: z.record(z.union([z.number(), z.string()])).optional(),
  customStandingsCriteria: z.array(z.string()).optional(),
});

// Available scoring rule types with descriptions
const AVAILABLE_SCORING_RULES = [
  { key: 'win', label: 'Win Points', description: 'Points awarded for a win', defaultValue: 3 },
  { key: 'draw', label: 'Draw Points', description: 'Points awarded for a draw/tie', defaultValue: 1 },
  { key: 'loss', label: 'Loss Points', description: 'Points awarded for a loss', defaultValue: 0 },
  { key: 'shutoutBonus', label: 'Shutout Bonus', description: 'Bonus points for keeping a clean sheet', defaultValue: 1 },
  { key: 'goalScored', label: 'Goal Scored', description: 'Points per goal scored', defaultValue: 0 },
  { key: 'maxGoalsPerGame', label: 'Max Goals Per Game', description: 'Maximum goals that count for points', defaultValue: 5 },
  { key: 'yellowCard', label: 'Yellow Card Penalty', description: 'Points deducted per yellow card', defaultValue: 0 },
  { key: 'redCard', label: 'Red Card Penalty', description: 'Points deducted per red card', defaultValue: -1 },
  { key: 'fairPlayBonus', label: 'Fair Play Bonus', description: 'Bonus for no cards received', defaultValue: 1 },
];

// Available standings criteria with descriptions
const AVAILABLE_STANDINGS_CRITERIA = [
  { key: 'points', label: 'Total Points', description: 'Total points from wins, draws, losses' },
  { key: 'goalDifferential', label: 'Goal Differential', description: 'Goals scored minus goals allowed' },
  { key: 'goalsScored', label: 'Goals Scored', description: 'Total goals scored' },
  { key: 'goalsAllowed', label: 'Goals Allowed', description: 'Total goals allowed' },
  { key: 'headToHead', label: 'Head-to-Head Result', description: 'Direct matchup result between tied teams' },
  { key: 'wins', label: 'Total Wins', description: 'Number of games won' },
  { key: 'shutouts', label: 'Shutouts', description: 'Number of clean sheets' },
  { key: 'fairPlay', label: 'Fair Play Points', description: 'Disciplinary record (fewer cards = better)' },
];

function ScoringStandingsSettings({ eventId }: ScoringStandingsSettingsProps) {
  const [activeTab, setActiveTab] = useState<'scoring' | 'standings' | 'event'>('event');
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
  const [editingScoringTemplate, setEditingScoringTemplate] = useState<ScoringRuleTemplate | null>(null);
  const [editingStandingsTemplate, setEditingStandingsTemplate] = useState<StandingsCriteriaTemplate | null>(null);
  const [customScoringRules, setCustomScoringRules] = useState<ScoringRule[]>([]);
  const [customStandingsCriteria, setCustomStandingsCriteria] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Scoring Rules Form
  const scoringForm = useForm({
    resolver: zodResolver(scoringRuleSchema),
    defaultValues: {
      name: '',
      description: '',
      scoringRules: {},
    },
  });

  // Standings Criteria Form
  const standingsForm = useForm({
    resolver: zodResolver(standingsCriteriaSchema),
    defaultValues: {
      name: '',
      description: '',
      standingsCriteria: [],
    },
  });

  // Event Configuration Form
  const eventConfigForm = useForm({
    resolver: zodResolver(eventConfigurationSchema),
    defaultValues: {
      eventId,
      includeChampionship: false,
    },
  });

  // Fetch scoring rule templates
  const scoringTemplatesQuery = useQuery({
    queryKey: ['scoring-rule-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/scoring-templates/scoring-rules');
      if (!response.ok) throw new Error('Failed to fetch scoring rule templates');
      return response.json() as Promise<ScoringRuleTemplate[]>;
    },
  });

  // Fetch standings criteria templates
  const standingsTemplatesQuery = useQuery({
    queryKey: ['standings-criteria-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/scoring-templates/standings-criteria');
      if (!response.ok) throw new Error('Failed to fetch standings criteria templates');
      return response.json() as Promise<StandingsCriteriaTemplate[]>;
    },
  });

  // Fetch event configuration
  const eventConfigQuery = useQuery({
    queryKey: ['event-scoring-configuration', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/scoring-templates/event-configuration/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event configuration');
      return response.json() as Promise<EventScoringConfiguration | null>;
    },
  });

  // Create scoring rule template mutation
  const createScoringTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/scoring-templates/scoring-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create scoring template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rule-templates'] });
      setIsScoringModalOpen(false);
      setEditingScoringTemplate(null);
      scoringForm.reset();
      setCustomScoringRules([]);
      toast({ title: 'Success', description: 'Scoring template created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Create standings criteria template mutation
  const createStandingsTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/scoring-templates/standings-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create standings template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings-criteria-templates'] });
      setIsStandingsModalOpen(false);
      setEditingStandingsTemplate(null);
      standingsForm.reset();
      setCustomStandingsCriteria([]);
      toast({ title: 'Success', description: 'Standings template created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Save event configuration mutation
  const saveEventConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/scoring-templates/event-configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save event configuration');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-scoring-configuration', eventId] });
      toast({ title: 'Success', description: 'Event configuration saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddScoringRule = () => {
    setCustomScoringRules([...customScoringRules, { name: '', value: 0, description: '' }]);
  };

  const handleUpdateScoringRule = (index: number, field: string, value: any) => {
    const updated = [...customScoringRules];
    updated[index] = { ...updated[index], [field]: value };
    setCustomScoringRules(updated);
  };

  const handleRemoveScoringRule = (index: number) => {
    setCustomScoringRules(customScoringRules.filter((_, i) => i !== index));
  };

  const handleScoringSubmit = (data: any) => {
    const scoringRulesObject: Record<string, number | string> = {};
    customScoringRules.forEach(rule => {
      if (rule.name) {
        scoringRulesObject[rule.name] = rule.value;
      }
    });

    createScoringTemplateMutation.mutate({
      ...data,
      scoringRules: scoringRulesObject,
    });
  };

  const handleStandingsSubmit = (data: any) => {
    createStandingsTemplateMutation.mutate({
      ...data,
      standingsCriteria: customStandingsCriteria,
    });
  };

  const handleStandingsCriteriaDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(customStandingsCriteria);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCustomStandingsCriteria(items);
  };

  const addStandingsCriteria = (criteriaKey: string) => {
    if (!customStandingsCriteria.includes(criteriaKey)) {
      setCustomStandingsCriteria([...customStandingsCriteria, criteriaKey]);
    }
  };

  const removeStandingsCriteria = (criteriaKey: string) => {
    setCustomStandingsCriteria(customStandingsCriteria.filter(c => c !== criteriaKey));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scoring & Standings</h2>
          <p className="text-gray-600">Configure dynamic scoring rules and standings criteria - NO hardcoded values</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('event')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'event'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Event Configuration
        </button>
        <button
          onClick={() => setActiveTab('scoring')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'scoring'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calculator className="w-4 h-4 inline mr-2" />
          Scoring Templates
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'standings'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Standings Templates
        </button>
      </div>

      {/* Event Configuration Tab */}
      {activeTab === 'event' && (
        <Card>
          <CardHeader>
            <CardTitle>Event Scoring & Standings Configuration</CardTitle>
            <CardDescription>
              Assign scoring rules and standings criteria to this event. Select from templates or create custom rules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...eventConfigForm}>
              <form onSubmit={eventConfigForm.handleSubmit((data) => saveEventConfigMutation.mutate(data))} className="space-y-6">
                {/* Scoring Rule Template Selection */}
                <FormField
                  control={eventConfigForm.control}
                  name="scoringRuleTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scoring Rules Template</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a scoring rules template..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {scoringTemplatesQuery.data?.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name} - {template.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Standings Criteria Template Selection */}
                <FormField
                  control={eventConfigForm.control}
                  name="standingsCriteriaTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standings Criteria Template</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a standings criteria template..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {standingsTemplatesQuery.data?.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name} - {template.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Championship Game Toggle */}
                <FormField
                  control={eventConfigForm.control}
                  name="includeChampionship"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Championship/Final Game</FormLabel>
                        <p className="text-sm text-gray-600">
                          Add a final game between top placements (e.g., 1st vs 2nd, Bracket A Winner vs Bracket B Winner)
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Championship Format */}
                {eventConfigForm.watch('includeChampionship') && (
                  <FormField
                    control={eventConfigForm.control}
                    name="championshipFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Championship Format</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 1st vs 2nd, Bracket A Winner vs Bracket B Winner"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button 
                  type="submit" 
                  disabled={saveEventConfigMutation.isPending}
                  className="w-full"
                >
                  {saveEventConfigMutation.isPending ? 'Saving...' : 'Save Event Configuration'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Scoring Templates Tab */}
      {activeTab === 'scoring' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Scoring Rule Templates</h3>
            <Button onClick={() => setIsScoringModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {scoringTemplatesQuery.data?.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(template.scoringRules).map(([key, value]) => (
                      <Badge key={key} variant="secondary">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Standings Templates Tab */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Standings Criteria Templates</h3>
            <Button onClick={() => setIsStandingsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {standingsTemplatesQuery.data?.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Priority Order:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.standingsCriteria.map((criteria, index) => (
                        <Badge key={criteria} variant="secondary">
                          {index + 1}. {AVAILABLE_STANDINGS_CRITERIA.find(c => c.key === criteria)?.label || criteria}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scoring Template Modal */}
      <Dialog open={isScoringModalOpen} onOpenChange={setIsScoringModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScoringTemplate ? 'Edit Scoring Template' : 'Create Scoring Template'}
            </DialogTitle>
            <DialogDescription>
              Define custom scoring rules for wins, draws, losses, and bonuses. No hardcoded values!
            </DialogDescription>
          </DialogHeader>

          <Form {...scoringForm}>
            <form onSubmit={scoringForm.handleSubmit(handleScoringSubmit)} className="space-y-6">
              <FormField
                control={scoringForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FIFA 3-Point System" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={scoringForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this scoring system..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quick Add Standard Rules */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Scoring Rules</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddScoringRule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Rule
                  </Button>
                </div>

                {/* Standard Rule Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_SCORING_RULES.map((rule) => (
                    <Button
                      key={rule.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomScoringRules([...customScoringRules, {
                        name: rule.key,
                        value: rule.defaultValue,
                        description: rule.description,
                      }])}
                      className="text-left justify-start"
                    >
                      + {rule.label}
                    </Button>
                  ))}
                </div>

                {/* Custom Scoring Rules */}
                <div className="space-y-3">
                  {customScoringRules.map((rule, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Rule Name</Label>
                        <Input
                          value={rule.name}
                          onChange={(e) => handleUpdateScoringRule(index, 'name', e.target.value)}
                          placeholder="e.g., win, shutoutBonus"
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">Value</Label>
                        <Input
                          type="number"
                          value={rule.value}
                          onChange={(e) => handleUpdateScoringRule(index, 'value', parseFloat(e.target.value) || 0)}
                          placeholder="3"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveScoringRule(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsScoringModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createScoringTemplateMutation.isPending}>
                  {createScoringTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Standings Template Modal */}
      <Dialog open={isStandingsModalOpen} onOpenChange={setIsStandingsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStandingsTemplate ? 'Edit Standings Template' : 'Create Standings Template'}
            </DialogTitle>
            <DialogDescription>
              Define the priority order for standings calculation. Drag to reorder criteria.
            </DialogDescription>
          </DialogHeader>

          <Form {...standingsForm}>
            <form onSubmit={standingsForm.handleSubmit(handleStandingsSubmit)} className="space-y-6">
              <FormField
                control={standingsForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FIFA Standard Tiebreakers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={standingsForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this standings system..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Available Criteria */}
              <div className="space-y-4">
                <Label>Available Criteria (click to add)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_STANDINGS_CRITERIA.map((criteria) => (
                    <Button
                      key={criteria.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStandingsCriteria(criteria.key)}
                      disabled={customStandingsCriteria.includes(criteria.key)}
                      className="text-left justify-start"
                    >
                      + {criteria.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selected Criteria - Drag & Drop */}
              <div className="space-y-4">
                <Label>Selected Criteria (drag to reorder priority)</Label>
                <DragDropContext onDragEnd={handleStandingsCriteriaDragEnd}>
                  <Droppable droppableId="standings-criteria">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {customStandingsCriteria.map((criteriaKey, index) => {
                          const criteria = AVAILABLE_STANDINGS_CRITERIA.find(c => c.key === criteriaKey);
                          return (
                            <Draggable key={criteriaKey} draggableId={criteriaKey} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                                >
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <Badge variant="secondary">{index + 1}</Badge>
                                  <div className="flex-1">
                                    <p className="font-medium">{criteria?.label}</p>
                                    <p className="text-sm text-gray-600">{criteria?.description}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeStandingsCriteria(criteriaKey)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsStandingsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStandingsTemplateMutation.isPending}>
                  {createStandingsTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ScoringStandingsSettings;