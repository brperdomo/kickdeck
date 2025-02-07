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
import {
  EventBranding,
  EventData,
  Complex,
  Field,
  EventSetting,
  EventAdministrator,
  Gender,
  FieldSize,
  AgeGroup,
  ScoringRule,
  EventTab,
  TAB_ORDER,
  USA_TIMEZONES,
  eventInformationSchema,
  ageGroupSchema,
  scoringRuleSchema,
  eventSettingSchema,
  EventInformationValues,
  AgeGroupValues,
  ScoringRuleValues,
  EventSettingValues,
  EventFormProps,
  AdminModalProps,
} from "./event-form-types";

const AgeGroupDialog = ({
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
}) => {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Age Group' : 'Add Age Group'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
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
            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Group</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., U10, U12" />
                  </FormControl>
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
                    <FormLabel>Birth Date Start</FormLabel>
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
                    <FormLabel>Birth Date End</FormLabel>
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
              name="projectedTeams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projected Teams</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fieldSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A'].map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
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
              name="amountDue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Due (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              {isEdit ? 'Update Age Group' : 'Add Age Group'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

interface EventAdministrator {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const EventForm = ({ initialData, onSubmit, isEdit = false }: EventFormProps) => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<EventTab>("information");
  const { toast } = useToast();

  // Initialize all state variables
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
  const [isSaving, setIsSaving] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.branding?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(initialData?.branding?.primaryColor || '#007AFF');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.branding?.secondaryColor || '#34C759');
  const [isExtracting, setIsExtracting] = useState(false);

  // Form setup
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

  // Scoring form setup
  const scoringForm = useForm<ScoringRuleValues>({
    resolver: zodResolver(scoringRuleSchema),
    defaultValues: editingScoringRule || {
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
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) {
        throw new Error('Failed to fetch complexes');
      }
      return response.json() as Promise<Complex[]>;
    },
    enabled: activeTab === 'complexes',
  });

  // Effects
  useEffect(() => {
    if (editingScoringRule) {
      scoringForm.reset(editingScoringRule);
    }
  }, [editingScoringRule, scoringForm]);

  // Event handlers
  const handleSubmit = async (data: EventInformationValues) => {
    setIsSaving(true);
    try {
      if (!data.name || !data.startDate || !data.endDate || !data.timezone || !data.applicationDeadline) {
        throw new Error('Required fields are missing');
      }

      const combinedData: EventData = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        timezone: data.timezone,
        applicationDeadline: data.applicationDeadline,
        details: data.details || "",
        agreement: data.agreement || "",
        refundPolicy: data.refundPolicy || "",
        ageGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: initialData?.administrators || [],
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
        description: isEdit ? "Event updated successfully" : "Event created successfully",
      });

      setLocation("/admin");
    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = "Failed to save event";
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.missingFields) {
            errorMessage = `Missing fields: ${errorData.missingFields.join(', ')}`;
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

    toast({
      title: editingAgeGroup ? "Age Group Updated" : "Age Group Added",
      description: `Successfully ${editingAgeGroup ? 'updated' : 'added'} age group`,
    });
  };

  const handleEditAgeGroup = (ageGroup: AgeGroup) => {
    setEditingAgeGroup(ageGroup);
    setIsAgeGroupDialogOpen(true);
  };

  const handleDeleteAgeGroup = (id: string) => {
    setAgeGroups(ageGroups.filter(group => group.id !== id));
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
  };

  const handleEditScoringRule = (rule: ScoringRule) => {
    setEditingScoringRule(rule);
    setIsScoringDialogOpen(true);
  };

  const handleDeleteScoringRule = (id: string) => {
    setScoringRules(scoringRules.filter(rule => rule.id !== id));
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
  };

  const handleEditSetting = (setting: EventSetting) => {
    setEditingSetting(setting);
    setIsSettingDialogOpen(true);
  };

  const handleDeleteSetting = (id: string) => {
    setSettings(settings.filter(setting => setting.id !== id));
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

  const validateFile = (file: File) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ACCEPTED_IMAGE_TYPES = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/svg+xml': ['.svg']
    };

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const fileType = file.type;
    if (!Object.keys(ACCEPTED_IMAGE_TYPES).includes(fileType)) {
      throw new Error('File must be a PNG, JPEG, or SVG image');
    }

    return true;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      if (!validateFile(file)) return;

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
  }, [toast, validateFile]);

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
            <CardContent className="p-4 flex justify-between itemscenter">
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

      {isEdit && <SaveButton />}
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
        <Button onClick={() => {
          setEditingAdmin(null);
          setIsAdminModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Administrator
        </Button>
      </div>

      <div className="grid gap-4">
        {initialData?.administrators.map((admin) => (
          <Card key={admin.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="font-semibold">
                    {admin.user.firstName} {admin.user.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {admin.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Role: {admin.role}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingAdmin({
                        id: admin.id,
                        email: admin.user.email,
                        firstName: admin.user.firstName,
                        lastName: admin.user.lastName,
                        roles: [admin.role],
                      });
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

      {isEdit && <SaveButton />}
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

    if (!complexesQuery.data?.length) {
      return (
        <div className="text-center text-muted-foreground">
          No complexes found.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {complexesQuery.data.map((complex) => (
            <Card key={complex.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedComplexIds.includes(complex.id)}
                    onCheckedChange={() => handleComplexSelection(complex.id)}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{complex.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {complex.fields.length} fields available
                    </p>
                  </div>
                  {selectedComplexIds.includes(complex.id) && (
                    <Select
                      value={complexFieldSizes[complex.id] || '11v11'}
                      onValueChange={(size) =>
                        handleFieldSizeChange(complex.id, size as FieldSize)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select size" />
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {isEdit && <SaveButton />}
      </div>
    );
  };

  // State declarations using existing component context

  const getTabValidationState = () => {
    const errors: Record<EventTab, boolean> = {
      'information': !form.formState.isValid,
      'age-groups': ageGroups.length === 0,
      'scoring': scoringRules.length === 0,
      'complexes': selectedComplexIds.length === 0,
      'settings': false, // Settings are optional
      'administrators': false, // Administrators are managed separately
    };
    return errors;
  };

  const tabErrors = getTabValidationState();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventTab)}>
            <TabsList className="w-full grid grid-cols-6 gap-4 mb-6 bg-[#F2F2F7] p-1 rounded-lg">
              {TAB_ORDER.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="w-full px-4 py-2 rounded-md text-sm font-medium transition-colors
                    data-[state=active]:bg-white data-[state=active]:text-[#007AFF] data-[state=active]:shadow-sm
                    text-[#1C1C1E] hover:text-[#007AFF]"
                >
                  {tab.replace('-', ' ').charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="information" className="space-y-6">
                {renderInformationContent()}
              </TabsContent>

              <TabsContent value="age-groups" className="space-y-6">
                {renderAgeGroupsContent()}
              </TabsContent>

              <TabsContent value="scoring" className="space-y-6">
                {renderScoringContent()}
              </TabsContent>

              <TabsContent value="complexes" className="space-y-6">
                {renderComplexesContent()}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {renderSettingsContent()}
              </TabsContent>

              <TabsContent value="administrators" className="space-y-6">
                {renderAdministratorsContent()}
              </TabsContent>
            </div>
          </Tabs>

          {/* Dialogs and Modals */}
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

          <AdminModal
            open={isAdminModalOpen}
            onOpenChange={setIsAdminModalOpen}
            adminToEdit={editingAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EventForm;