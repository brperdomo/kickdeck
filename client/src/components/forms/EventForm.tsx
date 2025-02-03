import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, Edit, Trash, Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Editor } from '@tinymce/tinymce-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { AdminModal } from "@/components/admin/AdminModal";

// Types and interfaces
export interface EventData {
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
  applicationDeadline: string;
  details?: string;
  agreement?: string;
  refundPolicy?: string;
  ageGroups: AgeGroup[];
  complexFieldSizes: Record<number, FieldSize>;
  selectedComplexIds: number[];
  scoringRules: ScoringRule[];
  settings: EventSetting[];
  administrators: EventAdministrator[];
}

interface Complex {
  id: number;
  name: string;
  fields: Field[];
}

interface Field {
  id: number;
  name: string;
  complexId: number;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
}

interface EventSetting {
  id: string;
  key: string;
  value: string;
}

interface EventAdministrator {
  id: string;
  userId: number;
  role: 'owner' | 'admin' | 'moderator';
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

type Gender = 'Male' | 'Female' | 'Coed';
type FieldSize = '3v3' | '4v4' | '5v5' | '6v6' | '7v7' | '8v8' | '9v9' | '10v10' | '11v11' | 'N/A';

interface AgeGroup {
  id: string;
  gender: Gender;
  projectedTeams: number;
  birthDateStart: string;
  birthDateEnd: string;
  scoringRule?: string;
  ageGroup: string;
  fieldSize: FieldSize;
  amountDue?: number | null;
}

interface ScoringRule {
  id: string;
  title: string;
  win: number;
  loss: number;
  tie: number;
  goalCapped: number;
  shutout: number;
  redCard: number;
  tieBreaker: string;
}

export type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';
export const TAB_ORDER: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

const USA_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

// Form Schemas
const eventInformationSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Time zone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
});

const ageGroupSchema = z.object({
  gender: z.enum(['Male', 'Female', 'Coed']),
  projectedTeams: z.number().min(0).max(200),
  birthDateStart: z.string().min(1, "Start date is required"),
  birthDateEnd: z.string().min(1, "End date is required"),
  scoringRule: z.string().optional(),
  ageGroup: z.string().min(1, "Age group is required"),
  fieldSize: z.enum(['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A']),
  amountDue: z.number().nullable().optional(),
});

const scoringRuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  win: z.number().min(0, "Win points must be positive"),
  loss: z.number().min(0, "Loss points must be positive"),
  tie: z.number().min(0, "Tie points must be positive"),
  goalCapped: z.number().min(0, "Goal cap must be positive"),
  shutout: z.number().min(0, "Shutout points must be positive"),
  redCard: z.number().min(-10, "Red card points must be greater than -10"),
  tieBreaker: z.string().min(1, "Tie breaker is required"),
});

const eventSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

type EventInformationValues = z.infer<typeof eventInformationSchema>;
type AgeGroupValues = z.infer<typeof ageGroupSchema>;
type ScoringRuleValues = z.infer<typeof scoringRuleSchema>;
type EventSettingValues = z.infer<typeof eventSettingSchema>;

interface EventFormProps {
  initialData?: EventData;
  onSubmit: (data: EventData) => void;
  isEdit?: boolean;
}

export function EventForm({ initialData, onSubmit, isEdit = false }: EventFormProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(initialData?.ageGroups || []);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(initialData?.scoringRules || []);
  const [settings, setSettings] = useState<EventSetting[]>(initialData?.settings || []);
  const [selectedComplexIds, setSelectedComplexIds] = useState<number[]>(initialData?.selectedComplexIds || []);
  const [complexFieldSizes, setComplexFieldSizes] = useState<Record<number, FieldSize>>(initialData?.complexFieldSizes || {});
  const [isAgeGroupDialogOpen, setIsAgeGroupDialogOpen] = useState(false);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = useState(false);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [editingSetting, setEditingSetting] = useState<EventSetting | null>(null);
   const [editingAdmin, setEditingAdmin] = useState<EventAdministrator | null>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch available complexes
  const complexesQuery = useQuery<Complex[]>({
    queryKey: ['/api/admin/complexes'],
    enabled: activeTab === 'complexes',
    initialData: [], // Provide empty array as initial data
  });

  // Fetch available administrators
  const administratorsQuery = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: activeTab === 'administrators',
  });

  const form = useForm<EventInformationValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues: initialData || {
      name: "",
      startDate: "",
      endDate: "",
      timezone: "",
      applicationDeadline: "",
      details: "",
      agreement: "",
      refundPolicy: "",
    },
  });

  const ageGroupForm = useForm<AgeGroupValues>({
    resolver: zodResolver(ageGroupSchema),
    defaultValues: {
      gender: 'Male',
      projectedTeams: 0,
      birthDateStart: '',
      birthDateEnd: '',
      scoringRule: '',
      ageGroup: '',
      fieldSize: '11v11',
      amountDue: null,
    }
  });

  const scoringForm = useForm<ScoringRuleValues>({
    resolver: zodResolver(scoringRuleSchema),
    defaultValues: {
      title: "",
      win: 3,
      loss: 0,
      tie: 1,
      goalCapped: 5,
      shutout: 1,
      redCard: -1,
      tieBreaker: "head_to_head",
    },
  });

  const settingForm = useForm<EventSettingValues>({
    resolver: zodResolver(eventSettingSchema),
    defaultValues: {
      key: "",
      value: "",
    },
  });

  // Initialize forms with existing data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      form.reset(initialData);
      setAgeGroups(initialData.ageGroups);
      setScoringRules(initialData.scoringRules || []);
      setSettings(initialData.settings || []);
      setSelectedComplexIds(initialData.selectedComplexIds || []);
      setComplexFieldSizes(initialData.complexFieldSizes || {});
    }
  }, [initialData, isEdit, form]);

  const handleSubmit = (data: EventInformationValues) => {
    const combinedData: EventData = {
      ...data,
      ageGroups,
      scoringRules,
      settings,
      complexFieldSizes,
      selectedComplexIds,
      administrators: initialData?.administrators || [],
    };
    onSubmit(combinedData);
  };

  const handleAddAgeGroup = (data: AgeGroupValues) => {
    if (editingAgeGroup) {
      setAgeGroups(ageGroups.map(group =>
        group.id === editingAgeGroup.id ? { ...data, id: group.id } : group
      ));
      setEditingAgeGroup(null);
    } else {
      setAgeGroups([...ageGroups, { ...data, id: Date.now().toString() }]);
    }
    setIsAgeGroupDialogOpen(false);
    ageGroupForm.reset();
  };

  const handleAddScoringRule = (data: ScoringRuleValues) => {
    if (editingScoringRule) {
      setScoringRules(rules => rules.map(rule =>
        rule.id === editingScoringRule.id ? { ...data, id: rule.id } : rule
      ));
      setEditingScoringRule(null);
    } else {
      setScoringRules([...scoringRules, { ...data, id: Date.now().toString() }]);
    }
    setIsScoringDialogOpen(false);
    scoringForm.reset();
  };

  const handleAddSetting = (data: EventSettingValues) => {
    if (editingSetting) {
      setSettings(settings => settings.map(setting =>
        setting.id === editingSetting.id ? { ...data, id: setting.id } : setting
      ));
      setEditingSetting(null);
    } else {
      setSettings([...settings, { ...data, id: Date.now().toString() }]);
    }
    setIsSettingDialogOpen(false);
    settingForm.reset();
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

  const handleEditAgeGroup = (ageGroup: AgeGroup) => {
    setEditingAgeGroup(ageGroup);
    ageGroupForm.reset(ageGroup);
    setIsAgeGroupDialogOpen(true);
  };

  const handleEditScoringRule = (rule: ScoringRule) => {
    setEditingScoringRule(rule);
    scoringForm.reset(rule);
    setIsScoringDialogOpen(true);
  };

  const handleDeleteAgeGroup = (id: string) => {
    setAgeGroups(ageGroups.filter(group => group.id !== id));
  };

  const handleDeleteScoringRule = (id: string) => {
    setScoringRules(scoringRules.filter(rule => rule.id !== id));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const formData = form.getValues();
      const combinedData: EventData = {
        ...formData,
        ageGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: initialData?.administrators || [],
      };
      await onSubmit(combinedData);
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const SaveButton = () => (
    <div className="flex justify-end mt-6 pt-4 border-t">
      <Button
        onClick={handleSaveChanges}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">{isEdit ? 'Edit Event' : 'Create Event'}</h2>
      </div>

      <Card className="mx-auto">
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as EventTab)}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-6 gap-4">
              <TabsTrigger value="information">Event Information</TabsTrigger>
              <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
              <TabsTrigger value="scoring">Scoring Settings</TabsTrigger>
              <TabsTrigger value="complexes">Complexes & Fields</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="administrators">Administrators</TabsTrigger>
            </TabsList>

            {/* Event Information Tab */}
            <TabsContent value="information">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                          <FormLabel>Event Start Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
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
                          <FormLabel>Event End Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
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
                        <FormLabel>Application Submission Deadline *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
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
                            init={{
                              height: 300,
                              menubar: true,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'help', 'wordcount'
                              ],
                              toolbar: 'undo redo | formatselect | ' +
                                'bold italic backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help',
                            }}
                            value={field.value}
                            onEditorChange={(content) => field.onChange(content)}
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
                            init={{
                              height: 300,
                              menubar: true,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'help', 'wordcount'
                              ],
                              toolbar: 'undo redo | formatselect | ' +
                                'bold italic backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help',
                            }}
                            value={field.value}
                            onEditorChange={(content) => field.onChange(content)}
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
                            init={{
                              height: 300,
                              menubar: true,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'help', 'wordcount'
                              ],
                              toolbar: 'undo redo | formatselect | ' +
                                'bold italic backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help',
                            }}
                            value={field.value}
                            onEditorChange={(content) => field.onChange(content)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/admin")}
                    >
                      Cancel
                    </Button>
                    <div className="flex gap-4">
                      <Button type="submit">
                        {isEdit ? 'Update Event' : 'Create Event'}
                      </Button>
                    </div>
                  </div>
                  {isEdit && <SaveButton />}
                </form>
              </Form>
            </TabsContent>

            {/* Age Groups Tab */}
            <TabsContent value="age-groups">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Age Groups</h3>
                  <Button onClick={() => {
                    setEditingAgeGroup(null);
                    ageGroupForm.reset();
                    setIsAgeGroupDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Age Group
                  </Button>
                </div>

                {/* Age Groups List */}
                <div className="grid gap-4">
                  {ageGroups.map((group) => (
                    <Card key={group.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{group.ageGroup} ({group.gender})</h4>
                          <p className="text-sm text-muted-foreground">
                            Birth Date Range: {group.birthDateStart} to {group.birthDateEnd}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAgeGroup(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteAgeGroup(group.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {isEdit && <SaveButton />}
              </div>

              {/* Age Group Dialog */}
              <Dialog open={isAgeGroupDialogOpen} onOpenChange={setIsAgeGroupDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingAgeGroup ? 'Edit Age Group' : 'Add Age Group'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...ageGroupForm}>
                    <form onSubmit={ageGroupForm.handleSubmit(handleAddAgeGroup)} className="space-y-4">
                      <FormField
                        control={ageGroupForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <FormControl>
                              <Select {...field}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Coed">Coed</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ageGroupForm.control}
                        name="projectedTeams"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Projected Teams</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ageGroupForm.control}
                        name="birthDateStart"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Date Start</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ageGroupForm.control}
                        name="birthDateEnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Date End</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ageGroupForm.control}
                        name="scoringRule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scoring Rule</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ageGroupForm.control}
                        name="ageGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Group</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ageGroupForm.control}
                        name="fieldSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Size</FormLabel>
                            <FormControl>
                              <Select {...field}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3v3">3v3</SelectItem>
                                  <SelectItem value="4v4">4v4</SelectItem>
                                  <SelectItem value="5v5">5v5</SelectItem>
                                  <SelectItem value="6v6">6v6</SelectItem>
                                  <SelectItem value="7v7">7v7</SelectItem>
                                  <SelectItem value="8v8">8v8</SelectItem>
                                  <SelectItem value="9v9">9v9</SelectItem>
                                  <SelectItem value="10v10">10v10</SelectItem>
                                  <SelectItem value="11v11">11v11</SelectItem>
                                  <SelectItem value="N/A">N/A</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ageGroupForm.control}
                        name="amountDue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Due</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">
                        {editingAgeGroup ? 'Update Age Group' : 'Add Age Group'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Scoring Settings Tab */}
            <TabsContent value="scoring">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Scoring Rules</h3>
                  <Button onClick={() => {
                    setEditingScoringRule(null);
                    scoringForm.reset();
                    setIsScoringDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Scoring Rule
                  </Button>
                </div>

                {/* Scoring Rules List */}
                <div className="grid gap-4">
                  {scoringRules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{rule.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Win: {rule.win} | Tie: {rule.tie} | Loss: {rule.loss}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditScoringRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteScoringRule(rule.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {isEdit && <SaveButton />}
              </div>

              {/* Scoring Rule Dialog */}
              <Dialog open={isScoringDialogOpen} onOpenChange={setIsScoringDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingScoringRule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...scoringForm}>
                    <form onSubmit={scoringForm.handleSubmit(handleAddScoringRule)} className="space-y-4">
                      <FormField
                        control={scoringForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scoringForm.control}
                        name="win"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Win Points</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scoringForm.control}
                        name="loss"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loss Points</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scoringForm.control}
                        name="tie"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tie Points</Form                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scoringForm.control}
                        name="goalCapped"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal Cap</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scoringForm.control}
                        name="shutout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shutout Points</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scoringForm.control}
                        name="redCard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Red Card Points</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scoringForm.control}
                        name="tieBreaker"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tie Breaker</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">
                        {editingScoringRule ? 'Update Scoring Rule' : 'Add Scoring Rule'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Complexes & Fields Tab */}
            <TabsContent value="complexes">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Complexes and Fields</h3>
                </div>

                {complexesQuery.isLoading ? (
                  <div>Loading complexes...</div>
                ) : complexesQuery.error ? (
                  <div>Error loading complexes</div>
                ) : (
                  <div className="space-y-4">
                    {(complexesQuery.data || []).map((complex: Complex) => (
                      <Card key={complex.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={selectedComplexIds.includes(complex.id)}
                                onCheckedChange={() => handleComplexSelection(complex.id)}
                              />
                              <h4 className="font-semibold">{complex.name}</h4>
                            </div>
                            {selectedComplexIds.includes(complex.id) && (
                              <Select
                                value={complexFieldSizes[complex.id] || '11v11'}
                                onValueChange={(value: FieldSize) => handleFieldSizeChange(complex.id, value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select field size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3v3">3v3</SelectItem>
                                  <SelectItem value="4v4">4v4</SelectItem>
                                  <SelectItem value="5v5">5v5</SelectItem>
                                  <SelectItem value="6v6">6v6</SelectItem>
                                  <SelectItem value="7v7">7v7</SelectItem>
                                  <SelectItem value="8v8">8v8</SelectItem>
                                  <SelectItem value="9v9">9v9</SelectItem>
                                  <SelectItem value="10v10">10v10</SelectItem>
                                  <SelectItem value="11v11">11v11</SelectItem>
                                  <SelectItem value="N/A">N/A</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {selectedComplexIds.includes(complex.id) && complex.fields && (
                            <div className="pl-8">
                              <h5 className="text-sm font-medium mb-2">Available Fields:</h5>
                              <ul className="space-y-2">
                                {complex.fields.map(field => (
                                  <li key={field.id} className="text-sm text-muted-foreground">
                                    {field.name}
                                    {field.hasLights && " (Lights)"}
                                    {field.hasParking && " (Parking)"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {isEdit && <SaveButton />}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Event Settings</h3>
                  <Button onClick={() => {
                    setEditingSetting(null);
                    settingForm.reset();
                    setIsSettingDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Setting
                  </Button>
                </div>

                <div className="space-y-4">
                  {settings.map(setting => (
                    <Card key={setting.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{setting.key}</h4>
                          <p className="text-sm text-muted-foreground">{setting.value}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSetting(setting);
                              settingForm.reset(setting);
                              setIsSettingDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setSettings(settings.filter(s => s.id !== setting.id));
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {isEdit && <SaveButton />}
              </div>

              <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSetting ? 'Edit Setting' : 'Add Setting'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...settingForm}>
                    <form onSubmit={settingForm.handleSubmit(handleAddSetting)} className="space-y-4">
                      <FormField
                        control={settingForm.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">
                        {editingSetting ? 'Update Setting' : 'Add Setting'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Administrators Tab */}
            
              <TabsContent value="administrators">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Event Administrators</h3>
                    <Button onClick={() => setIsAdminModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Administrator
                    </Button>
                  </div>
            
                  {/* Administrators List */}
                  <div className="grid gap-4">
                    {initialData?.administrators?.map((admin) => (
                      <Card key={admin.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{admin.user.firstName} {admin.user.lastName}</h4>
                            <p className="text-sm text-muted-foreground">{admin.user.email}</p>
                            <p className="text-sm">Role: {admin.role}</p>
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                 <AdminModal 
                  open={isAdminModalOpen}
                  onOpenChange={setIsAdminModalOpen}
                  adminToEdit={editingAdmin}
                />

                  {isEdit && <SaveButton />}
                </div>
              </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}