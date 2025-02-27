import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Editor } from "@tinymce/tinymce-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FeeManagement } from "@/components/events/FeeManagement";
import { AdminModal } from "@/components/admin/AdminModal";
import { ComplexSelector } from "@/components/events/ComplexSelector";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PREDEFINED_AGE_GROUPS,
  EventBranding,
  Complex,
  EventSetting,
  EventAdministrator,
  FieldSize,
  AgeGroup,
  ScoringRule,
  EventTab,
  TAB_ORDER,
  USA_TIMEZONES,
  eventInformationSchema,
  EventFormValues
} from "./event-form-types";

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

export const EventForm = ({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  activeTab,
  onTabChange,
  completedTabs,
  onCompletedTabsChange,
  navigateTab
}: EventFormProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(defaultValues?.ageGroups || []);
  const [selectedComplexIds, setSelectedComplexIds] = useState<number[]>(defaultValues?.selectedComplexIds || []);
  const [complexFieldSizes, setComplexFieldSizes] = useState<Record<number, FieldSize>>(defaultValues?.complexFieldSizes || {});
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(defaultValues?.scoringRules || []);
  const [settings, setSettings] = useState<EventSetting[]>(defaultValues?.settings || []);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<EventAdministrator | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValues?.branding?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(defaultValues?.branding?.primaryColor || '#007AFF');
  const [secondaryColor, setSecondaryColor] = useState(defaultValues?.branding?.secondaryColor || '#34C759');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = useState(false);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<EventSetting | null>(null);

  const complexesQuery = useQuery({
    queryKey: ['complexes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json() as Promise<Complex[]>;
    },
  });

  const feesQuery = useQuery({
    queryKey: ['fees', defaultValues?.id],
    queryFn: async () => {
      if (!defaultValues?.id) return [];
      const response = await fetch(`/api/admin/events/${defaultValues.id}/fees`);
      if (!response.ok) throw new Error('Failed to fetch fees');
      return response.json();
    },
    enabled: !!defaultValues?.id,
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues: defaultValues || {
      name: '',
      startDate: '',
      endDate: '',
      timezone: '',
      applicationDeadline: '',
      details: '',
      agreement: '',
      refundPolicy: '',
      ageGroups: [],
      selectedComplexIds: [],
      complexFieldSizes: {},
      scoringRules: [],
      settings: [],
      administrators: [],
      branding: {} as EventBranding
    }
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues]);

  const handleSubmit = async (formData: EventFormValues) => {
    setIsSaving(true);
    try {
      if (!formData.name || !formData.startDate || !formData.endDate || !formData.timezone || !formData.applicationDeadline) {
        throw new Error('Required fields are missing');
      }

      const preparedAgeGroups = ageGroups
        .filter(group => group.selected)
        .map(group => ({
          ...group,
          projectedTeams: group.projectedTeams || 0,
          birthDateStart: `${group.birthYear}-01-01`,
          birthDateEnd: `${group.birthYear}-12-31`,
          amountDue: group.amountDue || 0,
          fees: group.fees || []
        }));

      const combinedData = {
        ...formData,
        ageGroups: preparedAgeGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: defaultValues?.administrators || [],
        branding: {
          primaryColor,
          secondaryColor,
          logo,
          logoUrl: previewUrl || undefined,
        },
      };

      await onSubmit(combinedData);

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
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderInformationContent = () => (
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

  const renderAgeGroupsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Age Groups</h3>
        {defaultValues?.seasonalScopeName && (
          <Badge variant="outline" className="text-sm">
            {defaultValues.seasonalScopeName} ({defaultValues.seasonalStartYear}-{defaultValues.seasonalEndYear})
          </Badge>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Select</TableHead>
            <TableHead>Age Group</TableHead>
            <TableHead>Birth Year</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Division Code</TableHead>
            <TableHead>Field Size</TableHead>
            <TableHead>Amount Due</TableHead>
            <TableHead>Fees</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PREDEFINED_AGE_GROUPS.map((group) => {
            const existingGroup = ageGroups.find(
              (ag) => ag.divisionCode === group.divisionCode
            ) || { ...group, selected: false, fees: [] };

            const totalAmount = feesQuery.data
              ? (existingGroup.fees || []).reduce((sum, feeId) => {
                  const fee = feesQuery.data.find(f => f.id === feeId);
                  return sum + (fee?.amount || 0);
                }, 0)
              : 0;

            return (
              <TableRow key={group.divisionCode}>
                <TableCell>
                  <Checkbox
                    checked={!!existingGroup.selected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAgeGroups([
                          ...ageGroups,
                          {
                            id: Date.now().toString(),
                            ...group,
                            selected: true,
                            fees: [],
                            fieldSize: '11v11' as FieldSize,
                          },
                        ]);
                      } else {
                        setAgeGroups(
                          ageGroups.filter(
                            (ag) => ag.divisionCode !== group.divisionCode
                          )
                        );
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{group.ageGroup}</TableCell>
                <TableCell>{group.birthYear}</TableCell>
                <TableCell>{group.gender}</TableCell>
                <TableCell>{group.divisionCode}</TableCell>
                <TableCell>
                  {existingGroup.selected && (
                    <Select
                      value={existingGroup.fieldSize || "11v11"}
                      onValueChange={(size: FieldSize) => {
                        setAgeGroups(prevAgeGroups => prevAgeGroups.map(ag => {
                          if (ag.divisionCode === existingGroup.divisionCode) {
                            return {
                              ...ag,
                              fieldSize: size,
                            };
                          }
                          return ag;
                        }));
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>{existingGroup.fieldSize || "11v11"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A'].map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  ${(totalAmount / 100).toFixed(2)}
                </TableCell>
                <TableCell>
                  {existingGroup.selected && feesQuery.data ? (
                    <div className="flex flex-col space-y-2">
                      <div className="border rounded-md p-2">
                        <div className="flex flex-wrap gap-2">
                          {feesQuery.data.map(fee => (
                            <div key={fee.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`fee-${fee.id}-${existingGroup.divisionCode}`}
                                checked={existingGroup.fees?.includes(fee.id)}
                                onCheckedChange={(checked) => {
                                  setAgeGroups(prevAgeGroups => prevAgeGroups.map(ag => {
                                    if (ag.divisionCode === existingGroup.divisionCode) {
                                      const newFees = checked
                                        ? [...(ag.fees || []), fee.id]
                                        : (ag.fees || []).filter(f => f !== fee.id);
                                      return {
                                        ...ag,
                                        fees: newFees,
                                      };
                                    }
                                    return ag;
                                  }));
                                }}
                              />
                              <label
                                htmlFor={`fee-${fee.id}-${existingGroup.divisionCode}`}
                                className="text-sm"
                              >
                                {fee.name} - ${(fee.amount / 100).toFixed(2)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : feesQuery.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link to={`/admin/events/${defaultValues?.id}/fees`} className="text-blue-500 hover:text-blue-700 underline">
                      Manage Fees
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

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
        onComplexSelect={(id: number) => setSelectedComplexIds(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )}
        onFieldSizeChange={(id: number, size: FieldSize) =>
          setComplexFieldSizes(prev => ({ ...prev, [id]: size }))
        }
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
                    <Trash2 className="h-4 w-4" />
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
      'information': !form.formState.isValid,
      'age-groups': ageGroups.length === 0,
      'fees': false,
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
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/admin")}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">{mode === 'edit' ? 'Edit Event' : 'Create Event'}</h1>
            </div>

            <ProgressIndicator
              steps={TAB_ORDER}
              currentStep={activeTab}
              completedSteps={completedTabs}
            />

            <Tabs value={activeTab} onValueChange={handleTabChange as (value: string) => void} className="space-y-4">
              <TabsList>
                {TAB_ORDER.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    disabled={isSubmitting}
                    className="capitalize"
                  >
                    {tab.replace('-', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="information">
                {renderInformationContent()}
              </TabsContent>

              <TabsContent value="age-groups">
                {renderAgeGroupsContent()}
              </TabsContent>

              <TabsContent value="fees">
                {mode === 'edit' && defaultValues?.id ? (
                  <FeeManagement />
                ) : (
                  <div className="text-center py-6">
                    <p>Fee management will be available after creating the event.</p>
                  </div>
                )}
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
            </Tabs>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigateTab('prev')}
                disabled={TAB_ORDER.indexOf(activeTab) === 0 || isSubmitting}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {TAB_ORDER.indexOf(activeTab) === TAB_ORDER.length - 1 ? (
                  <Button
                    onClick={form.handleSubmit(handleSubmit)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : mode === 'edit' ? 'Save Changes' : 'Create Event'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => navigateTab('next')}
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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