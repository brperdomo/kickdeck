import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash, Loader2, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useDropzone } from 'react-dropzone';
import { AdminModal } from "@/components/admin/AdminModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Editor } from "@tinymce/tinymce-react";

// Types and interfaces
interface EventBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

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
  branding?: EventBranding;
}

interface Complex {
  id: number;
  name: string;
  fields: {
    id: number;
    name: string;
    complexId: number;
    hasLights: boolean;
    hasParking: boolean;
    isOpen: boolean;
  }[];
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

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminToEdit?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  } | null;
}

function AgeGroupDialog({
  open,
  onClose,
  onSubmit,
  defaultValues,
  isEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AgeGroupValues) => void;
  defaultValues?: AgeGroup;
  isEdit?: boolean;
}) {
  const form = useForm<AgeGroupValues>({
    resolver: zodResolver(ageGroupSchema),
    defaultValues: defaultValues || {
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

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: AgeGroupValues) => {
    onSubmit(data);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Age Group' : 'Add Age Group'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Group Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., U10, U12, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Coed">Coed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthDateStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date Start *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDateEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date End *</FormLabel>
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
              name="fieldSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Size *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A'].map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectedTeams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projected Teams *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amountDue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Due</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEdit ? 'Update' : 'Add'} Age Group
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export const EventForm = ({ initialData, onSubmit, isEdit = false }: EventFormProps) => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<EventTab>("information");
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(initialData?.ageGroups || []);
  const [selectedComplexIds, setSelectedComplexIds] = useState<number[]>(initialData?.selectedComplexIds || []);
  const [complexFieldSizes, setComplexFieldSizes] = useState<Record<number, FieldSize>>(initialData?.complexFieldSizes || {});
  const [isAgeGroupDialogOpen, setIsAgeGroupDialogOpen] = useState(false);
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(initialData?.scoringRules || []);
  const [settings, setSettings] = useState<EventSetting[]>(initialData?.settings || []);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = useState(false);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<EventSetting | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminModalProps['adminToEdit'] | null>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.branding?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(initialData?.branding?.primaryColor || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.branding?.secondaryColor || '#ffffff');
  const [isExtracting, setIsExtracting] = useState(false);

  // Form initialization
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

  const scoringForm = useForm<ScoringRuleValues>({
    resolver: zodResolver(scoringRuleSchema),
    defaultValues: {
      title: "",
      win: 0,
      loss: 0,
      tie: 0,
      goalCapped: 0,
      shutout: 0,
      redCard: 0,
      tieBreaker: "",
    },
  });

  // Query hooks
  const complexesQuery = useQuery({
    queryKey: ['complexes'],
    queryFn: async () => {
      const response = await fetch('/api/complexes');
      if (!response.ok) {
        throw new Error('Failed to fetch complexes');
      }
      return response.json() as Promise<Complex[]>;
    },
    enabled: activeTab === 'complexes',
  });

  useEffect(() => {
    if (editingScoringRule) {
      scoringForm.reset(editingScoringRule);
    }
  }, [editingScoringRule, scoringForm]);

  useEffect(() => {
    if (initialData && isEdit) {
      form.reset(initialData);
      setAgeGroups(initialData.ageGroups || []);
      setScoringRules(initialData.scoringRules || []);
      setSettings(initialData.settings || []);
      setSelectedComplexIds(initialData.selectedComplexIds || []);
      setComplexFieldSizes(initialData.complexFieldSizes || {});
      setPrimaryColor(initialData.branding?.primaryColor || '#000000');
      setSecondaryColor(initialData.branding?.secondaryColor || '#ffffff');
      setPreviewUrl(initialData.branding?.logoUrl || null);
    }
  }, [initialData, isEdit, form]);

  // Handlers
  const handleSubmit = async (data: EventInformationValues) => {
    setIsSaving(true);
    try {
      const combinedData: EventData = {
        ...data,
        ageGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: initialData?.administrators || [],
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: previewUrl || undefined,
        },
      };

      await onSubmit(combinedData);

      toast({
        title: "Success",
        description: isEdit ? "Event updated successfully" : "Event created successfully",
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

  // File upload handlers
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setLogo(file);
      setIsExtracting(true);

      const formData = new FormData();
      formData.append('logo', file);

      const uploadResponse = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload logo');
      }

      const { url: logoUrl } = await uploadResponse.json();
      setPreviewUrl(logoUrl);

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      });
      setLogo(null);
      setPreviewUrl(null);
    } finally {
      setIsExtracting(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/svg+xml': ['.svg']
    },
    maxFiles: 1,
    multiple: false,
  });

  // Save button component
  const SaveButton = () => (
    <Button
      onClick={form.handleSubmit(handleSubmit)}
      disabled={isSaving}
    >
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        isEdit ? 'Save Changes' : 'Create Event'
      )}
    </Button>
  );

  // Content rendering functions
  const renderContent = () => {
    switch (activeTab) {
      case 'information':
        return renderInformationContent();
      case 'age-groups':
        return renderAgeGroupsContent();
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
              <FormLabel>Application Submission Deadline *</FormLabel>
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

        <div className="flex justify-end">
          <SaveButton />
        </div>
      </form>
    </Form>
  );
};

const renderAgeGroupsContent = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Age Groups</h3>
      <Button onClick={() => {
        setEditingAgeGroup(null);
        setIsAgeGroupDialogOpen(true);
      }}>
        <Plus className="h-4 w-4 mr-2" />
        Add Age Group
      </Button>
    </div>

    <div className="grid gap-4">
      {ageGroups.map((group) => (
        <Card key={group.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-semibold">{group.ageGroup} ({group.gender})</h4>
                <p className="text-sm text-muted-foreground">
                  Birth Date Range: {new Date(group.birthDateStart).toLocaleDateString()} to {new Date(group.birthDateEnd).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Field Size: {group.fieldSize} | Projected Teams: {group.projectedTeams}
                </p>
                {group.amountDue && (
                  <p className="text-sm text-muted-foreground">
                    Amount Due: ${group.amountDue}
                  </p>
                )}
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
                  onClick={() => handleDeleteAgeGroup(group.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <AgeGroupDialog
      open={isAgeGroupDialogOpen}
      onClose={() => {
        setIsAgeGroupDialogOpen(false);
        setEditingAgeGroup(null);
      }}
      onSubmit={handleAddAgeGroup}
      defaultValues={editingAgeGroup || undefined}
      isEdit={!!editingAgeGroup}
    />
    {isEdit && <SaveButton />}
  </div>
);

const renderScoringContent = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Scoring Rules</h3>
      <Button onClick={() => {
        setEditingScoringRule(null);
        setIsScoringDialogOpen(true);
      }}>
        <Plus className="h-4 w-4 mr-2" />
        Add Scoring Rule
      </Button>
    </div>

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
                onClick={() => handleDeleteScoringRule(rule.id)}>
                <Trash className="h-4 w-4" />
              </Button>
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
                  <FormLabel>Tie Points</FormLabel>
                  <FormControl>
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
                    <Input type="number" {...field}/>
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
              )}            />
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
    <SaveButton/>
  </div>
);

const renderSettingsContent = () => (
  <div className="space-y-6">
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-4">Event Branding</h4>
          <div className="mb-2 text-sm text-muted-foreground">
            <p>Requirements:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>File types: PNG, JPEG, or SVG</li>
              <li>Maximum size: 5MB</li>
              <li>Recommended: Images with distinct colors for better color extraction</li>
            </ul>
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2">
              {isExtracting ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Extracting colors...</p>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Event logo"
                  className="h-20 w-20 object-contain"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground text-center">
                {isDragActive
                  ? "Drop the event logo here"
                  : "Drag & drop your event logo here, or click to select"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-12 p-1"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-4">Brand Preview</h4>
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center p-4 bg-background rounded-lg">
                <img
                  src={previewUrl}
                  alt="Event logo preview"
                  className="h-20 w-20 object-contain"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <div>
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="text-sm">Primary</span>
              </div>
              <div>
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="text-sm">Secondary</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    {isEdit && <SaveButton />}
  </div>
);

const renderAdministratorsContent = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Event Administrators</h3>
      <Button onClick={() => setIsAdminModalOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Administrator
      </Button>
    </div>

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
);

const renderComplexesContent = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Complexes and Fields</h3>
    </div>

    {complexesQuery.isLoading ? (
      <div>Loading complexes...</div>
    ) : complexesQuery.isError ? (
      <div>Error loading complexes: {complexesQuery.error instanceof Error ? complexesQuery.error.message : 'Unknown error'}</div>
    ) : !complexesQuery.data || complexesQuery.data.length === 0 ? (
      <div>No complexes found.</div>
    ) : (
      <div className="space-y-4">
        {complexesQuery.data.map((complex) => (
          <Card key={complex.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">{complex.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {complex.fields.length} fields
                  </p>
                </div>
                <Checkbox
                  checked={selectedComplexIds.includes(complex.id)}
                  onCheckedChange={() => handleComplexSelection(complex.id)}
                />
              </div>

              {selectedComplexIds.includes(complex.id) && (
                <div>
                  <Label>Field Size</Label>
                  <Select
                    value={complexFieldSizes[complex.id] || '11v11'}
                    onValueChange={(value: FieldSize) =>
                      handleFieldSizeChange(complex.id, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field size" />
                    </SelectTrigger>
                    <SelectContent>
                      {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A'].map(
                        (size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )}
    {isEdit && <SaveButton />}
  </div>
);

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
            <FormLabel>Application Submission Deadline *</FormLabel>
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

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  </Form>
);

const complexesQuery = useQuery({
  queryKey: ['complexes'],
  queryFn: async () => {
    const response = await fetch('/api/complexes');
    if (!response.ok) {
      throw new Error('Failed to fetch complexes');
    }
    return response.json() as Promise<Complex[]>;
  },
  enabled: activeTab === 'complexes',
});


const administratorsQuery = useQuery({
  queryKey: ['/api/admin/users'],
  enabled: activeTab === 'administrators',
});

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/svg+xml': ['.svg']
  },
  maxFiles: 1,
  multiple: false,
});

const handleEditAdmin = (admin: EventAdministrator) => {
  setEditingAdmin({
    id: admin.id,
    email: admin.user.email,
    firstName: admin.user.firstName,
    lastName: admin.user.lastName,
    roles: [admin.role],
  });
  setIsAdminModalOpen(true);
};

const renderContent = () => {
  switch (activeTab) {
    case 'information':
      return renderInformationContent();
    case 'age-groups':
      return renderAgeGroupsContent();
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

return (
  <div className="container mx-auto py-6 space-y-6">
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => setLocation('/admin')}>
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </Button>
      <h2 className="text-2xl font-bold">
        {isEdit ? 'Edit Event' : 'Create Event'}
      </h2>
    </div>

    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventTab)}>
      <TabsList className="grid w-full grid-cols-6">
        {TAB_ORDER.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="capitalize">
            {tab.replace('-', ' ')}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={activeTab}>
        {renderContent()}
      </TabsContent>
    </Tabs>

    <AdminModal
      open={isAdminModalOpen}
      onOpenChange={setIsAdminModalOpen}
      adminToEdit={editingAdmin}
    />

    <AgeGroupDialog
      open={isAgeGroupDialogOpen}
      onClose={() => {
        setIsAgeGroupDialogOpen(false);
        setEditingAgeGroup(null);
      }}
      onSubmit={handleAddAgeGroup}
      defaultValues={editingAgeGroup || undefined}
      isEdit={!!editingAgeGroup}
    />
  </div>
);
};

export default EventForm;