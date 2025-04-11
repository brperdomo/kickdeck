import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, Edit, Trash, CheckCircle, Upload, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { useDropzone } from 'react-dropzone';
import EventAdminModal from "@/components/events/EventAdminModal";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Editor } from "@tinymce/tinymce-react";

// TinyMCE API key from environment variable
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

import {
  PREDEFINED_AGE_GROUPS,
  EventBranding,
  EventData,
  Complex,
  Field,
  EventSetting,
  EventAdministrator,
  FieldSize,
  AgeGroup,
  ScoringRule,
  EventTab,
  TAB_ORDER,
  USA_TIMEZONES,
  eventInformationSchema,
  scoringRuleSchema,
  eventSettingSchema,
  EventInformationValues,
} from "./event-form-types";

interface EventFormValues extends EventInformationValues {
  ageGroups: AgeGroup[];
  selectedComplexIds: number[];
  complexFieldSizes: Record<number, FieldSize>;
  scoringRules: ScoringRule[];
  settings: EventSetting[];
  administrators: EventAdministrator[];
  branding: EventBranding;
  seasonalScopeId?: number;
}

interface EventFormProps {
  mode: 'create' | 'edit';
  defaultValues?: EventFormValues;
  onSubmit?: (data: EventFormValues) => Promise<void>;
  isSubmitting?: boolean;
  activeTab: EventTab;
  onTabChange?: (tab: EventTab) => void;
  completedTabs?: EventTab[];
  onCompletedTabsChange?: (tabs: EventTab[]) => void;
  navigateTab: (direction: 'next' | 'prev') => void;
  form?: any; // Allow passing in external form
}

export const EventForm = ({ 
  mode, 
  defaultValues, 
  onSubmit, 
  isSubmitting = false, 
  activeTab, 
  onTabChange, 
  completedTabs = [], 
  onCompletedTabsChange = () => {}, 
  navigateTab,
  form: externalForm
}: EventFormProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorUrl, setSponsorUrl] = useState('');
  const [sponsorLogo, setSponsorLogo] = useState<File | null>(null);
  const [sponsorPreview, setSponsorPreview] = useState<string | null>(null);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<EventSetting | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<EventAdministrator | null>(null);
  const [selectedSeasonalScopeId, setSelectedSeasonalScopeId] = useState<number | undefined>(
    defaultValues?.seasonalScopeId
  );

  // Use external form if provided, or create a local one
  const form = externalForm || useForm<EventFormValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      location: '',
      timezone: 'America/New_York',
      startDate: '',
      endDate: '',
      applicationDeadline: '',
      registrationEnabled: true,
      allowTeamRegistration: true,
      ageGroups: [],
      selectedComplexIds: [],
      complexFieldSizes: {},
      scoringRules: [],
      settings: [],
      administrators: [],
      branding: {
        logo: null,
        sponsors: [],
        primaryColor: '#3b82f6',
        secondaryColor: '#1e3a8a',
      },
    },
  });

  // Query to fetch complexes for the Complexes tab
  const complexesQuery = useQuery({
    queryKey: ['complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) {
        throw new Error('Failed to fetch complexes');
      }
      return response.json();
    },
  });

  // Query to fetch users for the Administrators tab
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });

  // Query to fetch event administrators
  const adminsQuery = useQuery({
    queryKey: ['event-admins', defaultValues?.id],
    queryFn: async () => {
      if (!defaultValues?.id) return [];
      const response = await fetch(`/api/admin/events/${defaultValues.id}/administrators`);
      if (!response.ok) {
        throw new Error('Failed to fetch administrators');
      }
      return response.json();
    },
    enabled: !!defaultValues?.id,
  });

  // Query to fetch seasonal scopes
  const seasonalScopesQuery = useQuery({
    queryKey: ['seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) {
        throw new Error('Failed to fetch seasonal scopes');
      }
      return response.json();
    },
  });

  const refetchAdmins = () => {
    if (defaultValues?.id) {
      adminsQuery.refetch();
    }
  };

  useEffect(() => {
    if (adminsQuery.data) {
      form.setValue('administrators', adminsQuery.data);
    }
  }, [adminsQuery.data, form]);

  // Setup form handlers for logo and sponsor uploads
  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedLogo(file);
        const previewUrl = URL.createObjectURL(file);
        setLogoPreview(previewUrl);
      }
    },
  });

  const { getRootProps: getSponsorRootProps, getInputProps: getSponsorInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSponsorLogo(file);
        const previewUrl = URL.createObjectURL(file);
        setSponsorPreview(previewUrl);
      }
    },
  });

  // Setup submit handler
  const handleSubmit = async (data: EventFormValues) => {
    try {
      setIsSaving(true);
      await onSubmit(data);
      setIsSaving(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSaving(false);
      toast({
        title: "Error",
        description: "There was an error saving the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Age groups management
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(
    defaultValues?.ageGroups || []
  );

  const handleAddAgeGroup = (predefinedGroup: AgeGroup) => {
    const newAgeGroups = [...ageGroups, { ...predefinedGroup }];
    setAgeGroups(newAgeGroups);
    form.setValue('ageGroups', newAgeGroups);
  };

  const handleRemoveAgeGroup = (index: number) => {
    const newAgeGroups = ageGroups.filter((_, i) => i !== index);
    setAgeGroups(newAgeGroups);
    form.setValue('ageGroups', newAgeGroups);
  };

  const handleFieldSizeChange = (ageGroupIndex: number, size: FieldSize) => {
    const newAgeGroups = [...ageGroups];
    newAgeGroups[ageGroupIndex].fieldSize = size;
    setAgeGroups(newAgeGroups);
    form.setValue('ageGroups', newAgeGroups);
  };

  const handleAgeGroupChange = (index: number, field: keyof AgeGroup, value: any) => {
    const newAgeGroups = [...ageGroups];
    newAgeGroups[index] = { ...newAgeGroups[index], [field]: value };
    setAgeGroups(newAgeGroups);
    form.setValue('ageGroups', newAgeGroups);
  };

  // Scoring rules management
  const handleAddScoringRule = () => {
    setEditingRule(null);
    setIsRuleDialogOpen(true);
  };

  const handleEditScoringRule = (rule: ScoringRule, index: number) => {
    setEditingRule({ ...rule, index });
    setIsRuleDialogOpen(true);
  };

  const handleSaveScoringRule = (rule: ScoringRule) => {
    const currentRules = form.getValues('scoringRules') || [];
    let newRules: ScoringRule[];

    if (editingRule && typeof editingRule.index === 'number') {
      newRules = [...currentRules];
      newRules[editingRule.index] = { ...rule };
    } else {
      newRules = [...currentRules, rule];
    }

    form.setValue('scoringRules', newRules);
    setIsRuleDialogOpen(false);
    setEditingRule(null);
  };

  const handleRemoveScoringRule = (index: number) => {
    const currentRules = form.getValues('scoringRules') || [];
    const newRules = currentRules.filter((_, i) => i !== index);
    form.setValue('scoringRules', newRules);
  };

  // Event settings management
  const handleAddSetting = () => {
    setEditingSetting(null);
    setIsSettingDialogOpen(true);
  };

  const handleEditSetting = (setting: EventSetting, index: number) => {
    setEditingSetting({ ...setting, index });
    setIsSettingDialogOpen(true);
  };

  const handleSaveSetting = (setting: EventSetting) => {
    const currentSettings = form.getValues('settings') || [];
    let newSettings: EventSetting[];

    if (editingSetting && typeof editingSetting.index === 'number') {
      newSettings = [...currentSettings];
      newSettings[editingSetting.index] = { ...setting };
    } else {
      newSettings = [...currentSettings, setting];
    }

    form.setValue('settings', newSettings);
    setIsSettingDialogOpen(false);
    setEditingSetting(null);
  };

  const handleRemoveSetting = (index: number) => {
    const currentSettings = form.getValues('settings') || [];
    const newSettings = currentSettings.filter((_, i) => i !== index);
    form.setValue('settings', newSettings);
  };

  const handleAddSponsor = () => {
    if (!sponsorName || !sponsorLogo) {
      toast({
        title: "Missing Information",
        description: "Please provide a sponsor name and logo.",
        variant: "destructive",
      });
      return;
    }

    const branding = form.getValues('branding') || { sponsors: [] };
    const newSponsor = {
      name: sponsorName,
      url: sponsorUrl,
      logo: sponsorLogo,
      logoPreview: sponsorPreview,
    };

    const newBranding = {
      ...branding,
      sponsors: [...(branding.sponsors || []), newSponsor],
    };

    form.setValue('branding', newBranding);
    setSponsorName('');
    setSponsorUrl('');
    setSponsorLogo(null);
    setSponsorPreview(null);
    setIsSponsorDialogOpen(false);
  };

  const handleRemoveSponsor = (index: number) => {
    const branding = form.getValues('branding');
    if (!branding || !branding.sponsors) return;

    const newSponsors = branding.sponsors.filter((_, i) => i !== index);
    form.setValue('branding', { ...branding, sponsors: newSponsors });
  };

  const handleSaveLogo = () => {
    if (!selectedLogo) {
      toast({
        title: "No Logo Selected",
        description: "Please select a logo image.",
        variant: "destructive",
      });
      return;
    }

    const branding = form.getValues('branding') || {};
    form.setValue('branding', {
      ...branding,
      logo: selectedLogo,
      logoPreview: logoPreview,
    });

    setIsLogoDialogOpen(false);
  };

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor', color: string) => {
    const branding = form.getValues('branding') || {};
    form.setValue('branding', { ...branding, [colorType]: color });
  };

  const handleSeasonalScopeChange = (scopeId: number) => {
    setSelectedSeasonalScopeId(scopeId);
    form.setValue('seasonalScopeId', scopeId);
  };

  const renderInformationContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location*</FormLabel>
              <FormControl>
                <Input placeholder="City, State" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date*</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date*</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="applicationDeadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Deadline*</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone*</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {USA_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Editor
                apiKey={TINYMCE_API_KEY}
                value={field.value}
                onEditorChange={(content) => field.onChange(content)}
                init={{
                  height: 300,
                  menubar: false,
                  plugins: 'lists link image table code help wordcount',
                  toolbar:
                    'undo redo | formatselect | bold italic | \
                    alignleft aligncenter alignright | \
                    bullist numlist outdent indent | link image | code',
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="registrationEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Registration Enabled</FormLabel>
                <FormDescription>
                  Allow teams to register for this event
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowTeamRegistration"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Allow Team Registration</FormLabel>
                <FormDescription>
                  Enable team self-registration for this event
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderAgeGroupsContent = (
    mode: 'create' | 'edit',
    selectedGroups: AgeGroup[],
    seasonalScopesQuery: any,
    selectedSeasonalScopeId?: number,
    onScopeSelect?: (id: number) => void
  ) => (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-medium">Seasonal Scope</h3>
        <div className="mb-4">
          <Label>Select Seasonal Scope</Label>
          <Select
            value={selectedSeasonalScopeId?.toString() || ""}
            onValueChange={(value) => {
              if (onScopeSelect) {
                onScopeSelect(parseInt(value));
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a seasonal scope" />
            </SelectTrigger>
            <SelectContent>
              {seasonalScopesQuery.isLoading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : seasonalScopesQuery.isError ? (
                <SelectItem value="error" disabled>
                  Error loading scopes
                </SelectItem>
              ) : (
                seasonalScopesQuery.data?.map((scope: any) => (
                  <SelectItem key={scope.id} value={scope.id.toString()}>
                    {scope.name} ({scope.startYear}-{scope.endYear})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!selectedSeasonalScopeId && (
            <p className="text-sm text-amber-600 mt-2">
              Without a seasonal scope, teams won't be able to register for this event.
            </p>
          )}
        </div>

        <h3 className="text-lg font-medium">Age Groups</h3>
        <p className="text-sm text-muted-foreground">
          Select the age groups that will participate in this event.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {PREDEFINED_AGE_GROUPS.map((group) => {
            const isSelected = selectedGroups.some(
              (g) => g.name === group.name && g.birthYearStart === group.birthYearStart && g.birthYearEnd === group.birthYearEnd
            );
            return (
              <Card
                key={`${group.name}-${group.birthYearStart}-${group.birthYearEnd}`}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => {
                  if (!isSelected) {
                    handleAddAgeGroup(group);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Birth Years: {group.birthYearStart} - {group.birthYearEnd}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedGroups.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Selected Age Groups</h3>
            <div className="space-y-4">
              {selectedGroups.map((group, index) => (
                <Card key={index} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Birth Years: {group.birthYearStart} - {group.birthYearEnd}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAgeGroup(index)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor={`fieldSize-${index}`}>Field Size</Label>
                      <Select
                        value={group.fieldSize || ''}
                        onValueChange={(value) => handleFieldSizeChange(index, value as FieldSize)}
                      >
                        <SelectTrigger id={`fieldSize-${index}`}>
                          <SelectValue placeholder="Select field size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor={`maxTeams-${index}`}>Max Teams</Label>
                      <Input
                        id={`maxTeams-${index}`}
                        type="number"
                        value={group.maxTeams || ''}
                        onChange={(e) => handleAgeGroupChange(index, 'maxTeams', parseInt(e.target.value) || undefined)}
                        placeholder="Enter maximum number of teams"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderScoringContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Scoring Rules</h3>
        <Button onClick={handleAddScoringRule} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {(form.getValues('scoringRules')?.length || 0) > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {form.getValues('scoringRules')?.map((rule, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>{rule.points}</TableCell>
                <TableCell>{rule.description}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditScoringRule(rule, index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveScoringRule(index)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No scoring rules added yet.</p>
        </div>
      )}

      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="tempRule.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Win, Loss, Tie"
                        value={editingRule?.name || ''}
                        onChange={(e) => setEditingRule({ ...editingRule || {}, name: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tempRule.points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 3, 0, 1"
                        value={editingRule?.points || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule || {},
                          points: parseInt(e.target.value) || 0
                        })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tempRule.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Short rule description"
                        value={editingRule?.description || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule || {},
                          description: e.target.value
                        })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRuleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (editingRule && editingRule.name && (typeof editingRule.points === 'number')) {
                    handleSaveScoringRule({
                      name: editingRule.name,
                      points: editingRule.points,
                      description: editingRule.description || '',
                    });
                  } else {
                    toast({
                      title: "Missing Information",
                      description: "Please provide a rule name and points value.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Save
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderComplexesContent = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Playing Complexes</h3>
      <p className="text-sm text-muted-foreground">
        Select the complexes where games for this event will be played.
      </p>

      {complexesQuery.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : complexesQuery.isError ? (
        <div className="text-center py-4 border rounded-md bg-destructive/10">
          <p className="text-destructive">Failed to load complexes. Please try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {complexesQuery.data?.map((complex: Complex) => {
            const isSelected = form.getValues('selectedComplexIds')?.includes(complex.id) || false;
            return (
              <Card
                key={complex.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => {
                  const currentIds = form.getValues('selectedComplexIds') || [];
                  if (isSelected) {
                    form.setValue(
                      'selectedComplexIds',
                      currentIds.filter((id) => id !== complex.id)
                    );
                  } else {
                    form.setValue('selectedComplexIds', [...currentIds, complex.id]);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{complex.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {complex.address}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {complex.fields?.length || 0} Fields • {complex.fieldCount || 0} Total
                      </p>
                    </div>
                    {isSelected && (
                      <Badge variant="outline" className="bg-primary text-primary-foreground">
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Event Settings</h3>
        <Button onClick={handleAddSetting} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Setting
        </Button>
      </div>

      {(form.getValues('settings')?.length || 0) > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setting</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {form.getValues('settings')?.map((setting, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{setting.name}</TableCell>
                <TableCell>{setting.value}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSetting(setting, index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSetting(index)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No event settings added yet.</p>
        </div>
      )}

      <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? 'Edit Event Setting' : 'Add Event Setting'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="tempSetting.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setting Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Game Duration, Roster Size"
                        value={editingSetting?.name || ''}
                        onChange={(e) =>
                          setEditingSetting({ ...editingSetting || {}, name: e.target.value })
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tempSetting.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 30 minutes, 18 players"
                        value={editingSetting?.value || ''}
                        onChange={(e) =>
                          setEditingSetting({ ...editingSetting || {}, value: e.target.value })
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (editingSetting && editingSetting.name && editingSetting.value) {
                    handleSaveSetting({
                      name: editingSetting.name,
                      value: editingSetting.value,
                    });
                  } else {
                    toast({
                      title: "Missing Information",
                      description: "Please provide a setting name and value.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Save
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Event Branding</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block">Logo</Label>
            <div
              className="border rounded-md p-4 cursor-pointer flex flex-col items-center justify-center"
              onClick={() => setIsLogoDialogOpen(true)}
            >
              {form.getValues('branding')?.logoPreview ? (
                <div className="relative w-full h-28 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={form.getValues('branding')?.logoPreview}
                    alt="Event Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to add an event logo
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Sponsors</Label>
            <div
              className="border rounded-md p-4 cursor-pointer flex flex-col items-center justify-center"
              onClick={() => setIsSponsorDialogOpen(true)}
            >
              {(form.getValues('branding')?.sponsors?.length || 0) > 0 ? (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {form.getValues('branding')?.sponsors.map((sponsor, index) => (
                      <div key={index} className="relative flex flex-col items-center p-2 border rounded">
                        {sponsor.logoPreview && (
                          <img
                            src={sponsor.logoPreview}
                            alt={sponsor.name}
                            className="w-16 h-16 object-contain mb-1"
                          />
                        )}
                        <span className="text-xs font-medium truncate max-w-full">
                          {sponsor.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSponsor(index);
                          }}
                        >
                          <Trash className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSponsorDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sponsor
                  </Button>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to add sponsors
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex mt-2">
              <div
                className="w-10 h-10 rounded-md mr-2"
                style={{
                  backgroundColor: form.getValues('branding')?.primaryColor || '#3b82f6',
                }}
              ></div>
              <Input
                id="primaryColor"
                type="color"
                value={form.getValues('branding')?.primaryColor || '#3b82f6'}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex mt-2">
              <div
                className="w-10 h-10 rounded-md mr-2"
                style={{
                  backgroundColor: form.getValues('branding')?.secondaryColor || '#1e3a8a',
                }}
              ></div>
              <Input
                id="secondaryColor"
                type="color"
                value={form.getValues('branding')?.secondaryColor || '#1e3a8a'}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isLogoDialogOpen} onOpenChange={setIsLogoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Event Logo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              {...getLogoRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input {...getLogoInputProps()} />
              {logoPreview ? (
                <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Drag & drop a logo image here, or click to select one
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Recommended: PNG or JPG, 1:1 aspect ratio
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLogoDialogOpen(false);
                  setLogoPreview(null);
                  setSelectedLogo(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveLogo}
                disabled={!selectedLogo}
              >
                Save Logo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSponsorDialogOpen} onOpenChange={setIsSponsorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sponsor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sponsorName">Sponsor Name*</Label>
              <Input
                id="sponsorName"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="Enter sponsor name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sponsorUrl">Website URL (optional)</Label>
              <Input
                id="sponsorUrl"
                value={sponsorUrl}
                onChange={(e) => setSponsorUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Sponsor Logo*</Label>
              <div
                {...getSponsorRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input {...getSponsorInputProps()} />
                {sponsorPreview ? (
                  <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={sponsorPreview}
                      alt="Sponsor Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-center text-muted-foreground">
                      Drag & drop a logo image here, or click to select one
                    </p>
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      Recommended: PNG or JPG, transparent background
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSponsorDialogOpen(false);
                  setSponsorName('');
                  setSponsorUrl('');
                  setSponsorLogo(null);
                  setSponsorPreview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddSponsor}
                disabled={!sponsorName || !sponsorLogo}
              >
                Add Sponsor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderAdministratorsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Event Administrators</h3>
        <Button 
          onClick={() => {
            setEditingAdmin(null);
            setIsAdminModalOpen(true);
          }} 
          variant="outline" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Administrator
        </Button>
      </div>

      {adminsQuery.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : adminsQuery.isError || !adminsQuery.data ? (
        <div className="text-center py-4 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">
            {mode === 'create' 
              ? 'You can add administrators after creating the event.' 
              : 'Failed to load administrators. Please try again.'}
          </p>
        </div>
      ) : adminsQuery.data.length === 0 ? (
        <div className="text-center py-4 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No administrators added yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminsQuery.data.map((admin: EventAdministrator) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.role}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingAdmin(admin);
                        setIsAdminModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  // Render the currently active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'information':
        return renderInformationContent();
      case 'age-groups':
        return renderAgeGroupsContent(
          mode,
          ageGroups,
          seasonalScopesQuery,
          selectedSeasonalScopeId,
          handleSeasonalScopeChange
        );
      case 'scoring':
        return renderScoringContent();
      case 'complexes':
        return renderComplexesContent();
      case 'settings':
        return renderSettingsContent();
      case 'administrators':
        return renderAdministratorsContent();
      default:
        return null;
    }
  };

  // Update completed tabs when fields are valid
  useEffect(() => {
    // You can add validation logic here to automatically mark tabs as completed
    // For now, we'll rely on the parent component to manage this
  }, [activeTab, form.formState.isDirty]);

  return (
    <div>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {renderActiveTabContent()}

        <div className="mt-6 flex justify-between">
          <div>
            {activeTab !== TAB_ORDER[0] && (
              <Button
                variant="outline"
                onClick={() => navigateTab('prev')}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/admin')}
            >
              Cancel
            </Button>
            
            {activeTab !== TAB_ORDER[TAB_ORDER.length - 1] ? (
              <Button
                type="button"
                onClick={() => navigateTab('next')}
                disabled={isSubmitting || isSaving}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || isSaving}
              >
                {isSubmitting || isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : mode === 'edit' ? 'Save Changes' : 'Finish & Create Event'}
              </Button>
            )}
          </div>
        </div>
      </form>
      
      <EventAdminModal
        open={isAdminModalOpen}
        onOpenChange={setIsAdminModalOpen}
        adminToEdit={editingAdmin}
        eventId={defaultValues?.id}
        onSave={() => {
          refetchAdmins();
          setIsAdminModalOpen(false);
          setEditingAdmin(null);
        }}
      />
    </div>
  );
};

export default EventForm;