import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, Edit, Trash, Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
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
import { useDropzone } from 'react-dropzone';
import { ImageIcon, Loader2 as Loader2Icon } from 'lucide-react';
import { useCallback } from "react";

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/svg+xml': ['.svg']
};

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
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.branding?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(initialData?.branding?.primaryColor || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.branding?.secondaryColor || '#ffffff');
  const [isExtracting, setIsExtracting] = useState(false);

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
      setPrimaryColor(initialData.branding?.primaryColor || '#000000');
      setSecondaryColor(initialData.branding?.secondaryColor || '#ffffff');
      setPreviewUrl(initialData?.branding?.logoUrl || null);
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
      branding: {
        primaryColor,
        secondaryColor,
        logoUrl: previewUrl
      }
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

  const validateFile = (file: File) => {
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
      validateFile(file);
      const objectUrl = URL.createObjectURL(file);

      // Load the image first to ensure it's valid
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image. Please try a different file.'));
        img.src = objectUrl;
      });

      setPreviewUrl(objectUrl);
      setLogo(file);
      setIsExtracting(true);

      try {
        // Create form data for file upload
        const formData = new FormData();
        formData.append('logo', file);

        // Upload the file
        const uploadResponse = await fetch('/api/upload/logo', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload logo. Please try again.');
        }

        const { url: logoUrl } = await uploadResponse.json();

        // Update preview URL with the server URL
        setPreviewUrl(logoUrl);

        // Import and use node-vibrant with CommonJS syntax
        const Vibrant = (await import('node-vibrant')).default;
        const v = new Vibrant(objectUrl);
        const palette = await v.getPalette();

        if (!palette || !palette.Vibrant) {
          throw new Error('Could not extract colors. Please use an image with more distinct colors.');
        }

        setPrimaryColor(palette.Vibrant.hex);

        // For secondary color, prefer LightVibrant, fallback to Muted
        const secondaryPalette = palette.LightVibrant || palette.Muted;
        if (!secondaryPalette) {
          throw new Error('Could not extract secondary colors. Please use an image with more color variety.');
        }

        setSecondaryColor(secondaryPalette.hex);

        toast({
          title: "Success",
          description: "Logo uploaded and colors extracted successfully.",
        });
      } catch (error) {
        console.error('Processing error:', error);
        toast({
          title: "Processing Error",
          description: error instanceof Error
            ? error.message
            : "Failed to process the image. Please use an image with more distinct colors.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('File error:', error);
      toast({
        title: "Error",
        description: error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing the file.",
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
    accept: Object.keys(ACCEPTED_IMAGE_TYPES).map(key => `${key}/*`).join(','),
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });


  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      const data = {
        ...form.getValues(),
        ageGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: initialData?.administrators || [],
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: previewUrl
        }
      };

      formData.append('data', JSON.stringify(data));
      if (logo) {
        formData.append('logo', logo);
      }

      await onSubmit(data);
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
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
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
                    <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Extracting colors...</p>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Event logo"
                    className="h-30 w-30 object-contain"
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
                    className="h-30 w-30 object-contain"
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
}

export default EventForm;