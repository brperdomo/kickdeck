import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Plus, Edit, Trash, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Editor } from "@tinymce/tinymce-react";
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
  ScoringRuleValues,
  EventSettingValues,
  AdminModalProps,
} from "./event-form-types";
import { ComplexSelector } from "@/components/events/ComplexSelector";
import { InfoPopover } from "@/components/ui/InfoPopover";
import {SeasonalScopeSelector} from "@/components/events/SeasonalScopeSelector";
import { Textarea } from "@/components/ui/textarea";


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
  onSubmit: (data: EventFormValues) => Promise<void>;
  isSubmitting?: boolean;
  activeTab: EventTab;
  onTabChange: (tab: EventTab) => void;
  completedTabs: EventTab[];
  onCompletedTabsChange: (tabs: EventTab[]) => void;
  navigateTab: (direction: 'next' | 'prev') => void;
}

export const EventForm = ({ mode, defaultValues, onSubmit, isSubmitting = false, activeTab, onTabChange, completedTabs, onCompletedTabsChange, navigateTab }: EventFormProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues
  });

  const [selectedSeasonalScopeId, setSelectedSeasonalScopeId] = useState<number | null>(
    defaultValues?.seasonalScopeId || null
  );
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(defaultValues?.scoringRules || []);
  const [settings, setSettings] = useState<EventSetting[]>(defaultValues?.settings || []);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = useState(false);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<EventSetting | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminModalProps['adminToEdit']>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValues?.branding?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(defaultValues?.branding?.primaryColor || '#007AFF');
  const [secondaryColor, setSecondaryColor] = useState(defaultValues?.branding?.secondaryColor || '#34C759');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedComplexIds, setSelectedComplexIds] = useState<number[]>(defaultValues?.selectedComplexIds || []);
  const [complexFieldSizes, setComplexFieldSizes] = useState<Record<number, FieldSize>>(defaultValues?.complexFieldSizes || {});


  const seasonalScopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    }
  });

  const ageGroupsQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes/age-groups', selectedSeasonalScopeId],
    queryFn: async () => {
      if (!selectedSeasonalScopeId) return [];
      const response = await fetch(`/api/admin/seasonal-scopes/${selectedSeasonalScopeId}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    },
    enabled: !!selectedSeasonalScopeId
  });

  useEffect(() => {
    if (ageGroupsQuery.data) {
      const newAgeGroups = ageGroupsQuery.data.map(group => ({
        ...group,
        selected: true,
        projectedTeams: 0,
        amountDue: 0
      }));
      setAgeGroups(newAgeGroups);
      form.setValue('ageGroups', newAgeGroups);
    }
  }, [ageGroupsQuery.data, form.setValue]);

  useEffect(() => {
    if (mode === 'edit' && defaultValues?.seasonalScopeId) {
      setSelectedSeasonalScopeId(defaultValues.seasonalScopeId);
    }
  }, [mode, defaultValues?.seasonalScopeId]);

  const handleSeasonalScopeChange = (scopeId: number) => {
    setSelectedSeasonalScopeId(scopeId);
    form.setValue('seasonalScopeId', scopeId);
  };

  const handleSubmit = async (data: EventFormValues) => {
    try {
      if (!selectedSeasonalScopeId) {
        toast({
          title: "Error",
          description: "Please select a seasonal scope",
          variant: "destructive"
        });
        return;
      }

      const submitData = {
        ...data,
        seasonalScopeId: selectedSeasonalScopeId,
        ageGroups: ageGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: defaultValues?.administrators || [],
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: previewUrl || undefined,
        },
      };

      await onSubmit(submitData);
      toast({
        title: "Success",
        description: mode === 'edit' ? "Event updated successfully" : "Event created successfully",
      });
      setLocation("/admin");
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save event",
        variant: "destructive"
      });
    }
  };

  const handleComplexSelection = (complexId: number) => {
    setSelectedComplexIds(prev =>
      prev.includes(complexId)
        ? prev.filter(id => id !== complexId)
        : [...prev, complexId]
    );
  };

  const handleFieldSizeChange = (complexId: number, size: FieldSize) => {
    setComplexFieldSizes(prev => ({
      ...prev,
      [complexId]: size
    }));
  };

  const handleDeleteAgeGroup = (id: string) => {
    setAgeGroups(prevAgeGroups => prevAgeGroups.filter(group => group.id !== id));
  };

  const complexesQuery = useQuery({
    queryKey: ['complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) {
        throw new Error('Failed to fetch complexes');
      }
      return response.json() as Promise<Complex[]>;
    },
    enabled: activeTab === 'complexes',
  });

  const feesQuery = useQuery({
    queryKey: ['eventFees', defaultValues?.id],
    queryFn: async () => {
      if (!defaultValues?.id) return [];
      const response = await fetch(`/api/admin/events/${defaultValues.id}/fees`);
      if (!response.ok) {
        throw new Error("Failed to fetch fees");
      }
      return response.json();
    },
    enabled: !!defaultValues?.id
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      setLogo(acceptedFiles[0]);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(acceptedFiles[0]);
    },
  });

  const renderAgeGroupsContent = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <Label htmlFor="seasonalScope">Seasonal Scope</Label>
        <Select 
          onValueChange={(value) => handleSeasonalScopeChange(Number(value))}
          value={selectedSeasonalScopeId?.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a seasonal scope" />
          </SelectTrigger>
          <SelectContent>
            {seasonalScopesQuery.data?.map((scope:any) => (
              <SelectItem key={scope.id} value={scope.id.toString()}>
                {scope.name} ({scope.startYear}-{scope.endYear})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSeasonalScopeId && (
        <Card>
          <CardHeader>
            <CardTitle>Age Groups</CardTitle>
            <CardDescription>
              All age groups from this seasonal scope will be automatically included in the event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ageGroupsQuery.isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : ageGroups.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Age groups configured automatically
                      </h3>
                      <p className="mt-2 text-sm text-green-700">
                        All {ageGroups.length} age groups from this seasonal scope will be included in your event.
                      </p>
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Birth Year</TableHead>
                      <TableHead>Division Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroups.map((group) => (
                      <TableRow key={`${group.gender}-${group.birthYear}`}>
                        <TableCell>{group.ageGroup}</TableCell>
                        <TableCell>{group.gender}</TableCell>
                        <TableCell>{group.birthYear}</TableCell>
                        <TableCell>{group.divisionCode}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No age groups found for this seasonal scope
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderInformationContent = () => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter event name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
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
                <FormLabel>End Date *</FormLabel>
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
              <FormLabel>Time Zone *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {USA_TIMEZONES.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
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
          name="applicationDeadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Deadline *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details About This Event</FormLabel>
              <FormControl>
                <Editor
                  apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
                  value={field.value}
                  onEditorChange={(content) => field.onChange(content)}
                  init={{
                    height: 300,
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                    base_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.3',
                    suffix: '.min'
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agreement</FormLabel>
              <FormControl>
                <Editor
                  apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
                  value={field.value}
                  onEditorChange={(content) => field.onChange(content)}
                  init={{
                    height: 300,
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                    base_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.3',
                    suffix: '.min'
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="refundPolicy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refund Policy</FormLabel>
              <FormControl>
                <Editor
                  apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
                  value={field.value}
                  onEditorChange={(content) => field.onChange(content)}
                  init={{
                    height: 300,
                    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                    base_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.3',
                    suffix: '.min'
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </form>
      </Form>
    );
  };

  const renderComplexesContent = () => {
    if (complexesQuery.isLoading) {
      return (
        <div className="flex justify-center items-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (complexesQuery.isError) {
      return (
        <div className="text-center text-destructive">
          Failed to load complexes. Please try again.
        </div>
      );
    }

    return (
      <ComplexSelector
        selectedComplexIds={selectedComplexIds}
        complexFieldSizes={complexFieldSizes}
        onComplexSelect={handleComplexSelection}
        onFieldSizeChange={handleFieldSizeChange}
      />
    );
  };

  const renderScoringContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Scoring Rules</h3>
        <Button onClick={() => {
          setEditingScoringRule(null);
          setIsScoringDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {scoringRules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="font-semibold">{rule.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Points: {rule.points}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingScoringRule(rule);
                      setIsScoringDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setScoringRules(scoringRules.filter(r => r.id !== rule.id));
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isScoringDialogOpen} onOpenChange={setIsScoringDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingScoringRule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newRule = {
                id: editingScoringRule?.id || Date.now().toString(),
                name: formData.get('name') as string,
                points: parseInt(formData.get('points') as string),
              };

              if (editingScoringRule) {
                setScoringRules(scoringRules.map(r =>
                  r.id === editingScoringRule.id ? newRule : r
                ));
              } else {
                setScoringRules([...scoringRules, newRule]);
              }

              setIsScoringDialogOpen(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingScoringRule?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                name="points"
                type="number"
                defaultValue={editingScoringRule?.points}
                required
              />
            </div>
            <Button type="submit">
              {editingScoringRule ? 'Update Rule' : 'Add Rule'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderAdministratorsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Event Administrators</h3>
        <Button onClick={() => {
          setEditingAdmin(null);
          setIsAdminModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Administrator
        </Button>
      </div>

      <div className="grid gap-4">
        {defaultValues?.administrators?.map((admin) => (
          <Card key={admin.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="font-semibold">
                    {admin.firstName} {admin.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {admin.email}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Roles: {admin.roles?.join(', ') || ''}
                  </p>
                </div>
                <div className="flex gap-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const getTabValidationState = () => {
    const errors: Record<EventTab, boolean> = {
      'information': false,
      'age-groups': false,
      'scoring': scoringRules.length === 0,
      'complexes': selectedComplexIds.length === 0,
      'settings': false,
      'administrators': false,
    };
    return errors;
  };

  const tabErrors = getTabValidationState();

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Event Settings</h3>
        <Button onClick={() => {
          setEditingSetting(null);
          setIsSettingDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Setting
        </Button>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="font-semibold">{setting.key}</h4>
                  <p className="text-sm text-muted-foreground">
                    Value: {setting.value}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingSetting(setting);
                      setIsSettingDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSettings(settings.filter(s => s.id !== setting.id));
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Logo
        </label>
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag 'n' drop some files here, or click to select files</p>
          }
          {previewUrl && <img src={previewUrl} alt="Preview" width={100} />}
        </div>
      </div>

      <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? 'Edit Setting' : 'Add Setting'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newSetting = {
                id: editingSetting?.id || Date.now().toString(),
                key: formData.get('key') as string,
                value: formData.get('value') as string,
              };

              if (editingSetting) {
                setSettings(settings.map(s =>
                  s.id === editingSetting.id ? newSetting : s
                ));
              } else {
                setSettings([...settings, newSetting]);
              }

              setIsSettingDialogOpen(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="key">Setting Key</Label>
              <Input
                id="key"
                name="key"
                defaultValue={editingSetting?.key}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Setting Value</Label>
              <Input
                id="value"
                name="value"
                defaultValue={editingSetting?.value}
                required
              />
            </div>
            <Button type="submit">
              {editingSetting ? 'Update Setting' : 'Add Setting'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  const handleTabChange = (tab: EventTab) => {
    onTabChange(tab);
  };

  const isEditMode = mode === "edit";


  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as EventTab)}>
            <TabsList className="w-full grid grid-cols-6 gap-4 mb-6 bg-[#F2F2F7] p-1 rounded-lg">
              {TAB_ORDER.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={`wfullpx-4 py-2 rounded-md text-sm font-medium transition-colors
                    data-[state=active]:bg-white data-[state=active]:text-[#007AFF] data-[state=active]:shadow-sm
                    text-[#1C1C1E] hover:text-[#007AFF]`}
                >
                  {tab.replace('-', ' ').charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="information">
                {renderInformationContent()}
              </TabsContent>

              <TabsContent value="age-groups">
                {renderAgeGroupsContent()}
              </TabsContent>

              <TabsContent value="scoring">
                {renderScoringContent()}
              </TabsContent>

              <TabsContent value="complexes">
                {renderComplexesContent()}
              </TabsContent>

              <TabsContent value="settings">
                {renderSettingsContent()}
              </TabsContent>

              <TabsContent value="administrators">
                {renderAdministratorsContent()}
              </TabsContent>
            </div>
          </Tabs>

          <div className="mt-6 flex justify-end space-x-4">
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

            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting || isSaving}
            >
              {isSubmitting || isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : mode === 'edit' ? 'Save Changes' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <AdminModal
        open={isAdminModalOpen}
        onOpenChange={setIsAdminModalOpen}
        adminToEdit={editingAdmin}
        eventId={defaultValues?.id}
        onSave={() => {
          setIsAdminModalOpen(false);
          setEditingAdmin(null);
        }}
      />
    </div>
  );
};

export default EventForm;