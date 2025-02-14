import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, Edit, Trash, Eye, ArrowRight, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor } from '@tinymce/tinymce-react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ComplexEditor } from "@/components/ComplexEditor";
import { ComplexSelector } from "@/components/events/ComplexSelector";
import { useDropzone } from 'react-dropzone';

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  openTime: string;
  closeTime: string;
  rules?: string;
  directions?: string;
  isOpen: boolean;
}

interface EventBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface EventData {
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
  branding?: EventBranding;
}

const validateEventData = (data: Partial<EventData>, selectedScopeId: number | null, selectedAgeGroupIds: number[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate basic event information
  if (!data.name) errors.push("Event name is required");
  if (!data.startDate) errors.push("Start date is required");
  if (!data.endDate) errors.push("End date is required");
  if (!data.timezone) errors.push("Timezone is required");
  if (!data.applicationDeadline) errors.push("Application deadline is required");

  // Validate seasonal scope and age groups
  if (!selectedScopeId) {
    errors.push("A seasonal scope must be selected");
  }

  if (selectedAgeGroupIds.length === 0) {
    errors.push("At least one age group must be selected from the chosen seasonal scope");
  }

  // Validate complex selection
  if (!data.selectedComplexIds || data.selectedComplexIds.length === 0) {
    errors.push("At least one complex must be selected");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';

const TAB_ORDER: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

const USA_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const eventInformationSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().optional(), // Just date
  endDate: z.string().optional(), // Just date
  timezone: z.string().optional(),
  applicationDeadline: z.string().optional(), // Date with time
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
});

const ageGroupSchema = z.object({
  gender: z.enum(['Male', 'Female', 'Coed']),
  projectedTeams: z.number().min(0).max(200),
  birthDateStart: z.string().optional(),
  birthDateEnd: z.string().optional(),
  scoringRule: z.string().optional(),
  ageGroup: z.string().optional(),
  fieldSize: z.enum(['3v3', '4v4', '5v5', '6v6', '7v7', '8v8', '9v9', '10v10', '11v11', 'N/A']),
  amountDue: z.number().nullable().optional(),
});

type EventInformationValues = z.infer<typeof eventInformationSchema>;
type AgeGroupValues = z.infer<typeof ageGroupSchema>;

type Gender = 'Male' | 'Female' | 'Coed';
type FieldSize = '3v3' | '4v4' | '5v5' | '6v6' | '7v7' | '8v8' | '9v9' | '10v10' | '11v11' | 'N/A';

interface AgeGroup extends AgeGroupValues {
  id: string;
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

type ScoringRuleValues = z.infer<typeof scoringRuleSchema>;

interface SelectedComplex extends Complex {
  selected: boolean;
}

const complexSelectionSchema = z.object({
  selectedComplexIds: z.array(z.string()).optional()
});

type ComplexSelectionValues = z.infer<typeof complexSelectionSchema>;

interface Field {
  id: number;
  name: string;
  hasLights: boolean;
  hasParking: boolean;
  isOpen: boolean;
  specialInstructions: string | null;
}

const complexFormSchema = z.object({
  name: z.string().min(1, "Complex name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  openTime: z.string().min(1, "Open time is required"),
  closeTime: z.string().min(1, "Close time is required"),
  rules: z.string().optional(),
  directions: z.string().optional(),
  isOpen: z.boolean(),
});

type ComplexFormValues = z.infer<typeof complexFormSchema>;

const ProgressIndicator = ({ tabs, completedTabs }: { tabs: EventTab[], completedTabs: EventTab[] }) => {
  return (
    <div className="flex justify-center mb-6">
      {tabs.map((tab, index) => (
        <div key={tab} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center
              ${completedTabs.includes(tab) ? 'bg-[#43A047] text-white' : 'bg-gray-300'}
            `}
          >
            {index + 1}
          </div>
          {index < tabs.length - 1 && (
            <div className={`w-4 h-px bg-gray-300 ${completedTabs.includes(tab) ? 'bg-[#43A047]' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
};

interface SeasonalScope {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  ageGroups: AgeGroupSettings[];
}

interface AgeGroupSettings {
  id: number;
  seasonalScopeId: number;
  ageGroup: string;
  birthYear: number;
  gender: string;
  divisionCode: string;
  minBirthYear: number;
  maxBirthYear: number;
  createdAt: string;
  updatedAt: string;
}

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [selectedComplexes, setSelectedComplexes] = useState<SelectedComplex[]>([]);
  const [viewingComplexId, setViewingComplexId] = useState<number | null>(null);
  const [eventFieldSizes, setEventFieldSizes] = useState<Record<number, FieldSize>>({});
  const { toast } = useToast();
  const [isComplexDialogOpen, setIsComplexDialogOpen] = useState(false);
  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [isSaving, setIsSaving] = useState(false);
  const [tabErrors, setTabErrors] = useState<Record<EventTab, boolean>>({
    information: false,
    'age-groups': false,
    scoring: false,
    complexes: false,
    settings: false,
    administrators: false,
  });
  const [selectedComplexIds, setSelectedComplexIds] = useState<number[]>([]);
  const [selectedScopeId, setSelectedScopeId] = useState<number | null>(null);
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<number[]>([]);


  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    enabled: activeTab === 'complexes',
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/complexes');
        if (!response.ok) {
          throw new Error('Failed to fetch complexes');
        }
        const data = await response.json();
        return data as Complex[];
      } catch (error) {
        console.error('Error fetching complexes:', error);
        throw error;
      }
    }
  });

  const fieldsQuery = useQuery({
    queryKey: ['/api/admin/fields', viewingComplexId],
    enabled: !!viewingComplexId,
    queryFn: async () => {
      if (!viewingComplexId) return [];
      try {
        const response = await fetch(`/api/admin/complexes/${viewingComplexId}/fields`);
        if (!response.ok) {
          throw new Error('Failed to fetch fields');
        }
        const data = await response.json();
        return data as Field[];
      } catch (error) {
        console.error('Error fetching fields:', error);
        throw error;
      }
    }
  });

  const seasonalScopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json() as Promise<SeasonalScope[]>;
    }
  });

  const navigateTab = (direction: 'next' | 'prev') => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (direction === 'next' && currentIndex < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(TAB_ORDER[currentIndex - 1]);
    }
  };

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

  const handleAddAgeGroup = (data: AgeGroupValues) => {
    if (editingAgeGroup) {
      setAgeGroups(ageGroups.map(group =>
        group.id === editingAgeGroup.id ? { ...data, id: group.id } : group
      ));
      setEditingAgeGroup(null);
    } else {
      setAgeGroups([...ageGroups, { ...data, id: generateId() }]);
    }
    setIsDialogOpen(false);
    ageGroupForm.reset();
  };

  const handleEditAgeGroup = (ageGroup: AgeGroup) => {
    setEditingAgeGroup(ageGroup);
    ageGroupForm.reset(ageGroup);
    setIsDialogOpen(true);
  };

  const handleDeleteAgeGroup = (id: string) => {
    setAgeGroups(ageGroups.filter(group => group.id !== id));
  };

  const form = useForm<EventInformationValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues: {
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

  const onSubmit = (data: EventInformationValues) => {
    console.log(data);
    navigateTab('next');
  };

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

  const handleScoringRuleSubmit = (data: ScoringRuleValues) => {
    if (editingScoringRule) {
      setScoringRules(rules => rules.map(rule =>
        rule.id === editingScoringRule.id ? { ...data, id: rule.id } : rule
      ));
      setEditingScoringRule(null);
    } else {
      setScoringRules([...scoringRules, { ...data, id: generateId() }]);
    }
    setIsScoringModalOpen(false);
    scoringForm.reset();
  };

  const handleEditScoringRule = (rule: ScoringRule) => {
    setEditingScoringRule(rule);
    scoringForm.reset({
      title: rule.title,
      win: rule.win,
      loss: rule.loss,
      tie: rule.tie,
      goalCapped: rule.goalCapped,
      shutout: rule.shutout,
      redCard: rule.redCard,
      tieBreaker: rule.tieBreaker,
    });
    setIsScoringModalOpen(true);
  };

  const handleDeleteScoringRule = (id: string) => {
    setScoringRules(scoringRules.filter(rule => rule.id !== id));
  };

  const complexSelectionForm = useForm<ComplexSelectionValues>({
    resolver: zodResolver(complexSelectionSchema),
    defaultValues: {
      selectedComplexIds: []
    }
  });

  const handleEditComplex = (complex: Complex) => {
    try {
      setEditingComplex(complex);
      setIsComplexDialogOpen(true);
    } catch (error) {
      console.error('Error setting up complex edit:', error);
      toast({
        title: "Error",
        description: "Failed to open complex editor",
        variant: "destructive",
      });
    }
  };

  const handleViewFields = (complexId: number) => {
    try {
      setViewingComplexId(complexId);
    } catch (error) {
      console.error('Error setting up fields view:', error);
      toast({
        title: "Error",
        description: "Failed to view fields",
        variant: "destructive",
      });
    }
  };

  const handleCreateComplex = async (data: ComplexFormValues) => {
    try {
      const response = await fetch('/api/admin/complexes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create complex');
      }

      toast({
        title: "Success",
        description: "Complex created successfully",
      });

      setIsComplexDialogOpen(false);
      await queryClient.invalidateQueries(['/api/admin/complexes']);
    } catch (error) {
      console.error('Error creating complex:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create complex",
        variant: "destructive",
      });
    }
  };

  const handleUpdateComplex = async (data: ComplexFormValues) => {
    if (!editingComplex) return;

    try {
      const response = await fetch(`/api/admin/complexes/${editingComplex.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update complex');
      }

      toast({
        title: "Success",
        description: "Complex updated successfully",
      });

      setIsComplexDialogOpen(false);
      setEditingComplex(null);
      await queryClient.invalidateQueries(['/api/admin/complexes']);
    } catch (error) {
      console.error('Error updating complex:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update complex",
        variant: "destructive",
      });
    }
  };

  const onComplexSelectionSubmit = (data: ComplexSelectionValues) => {
    const selectedIds = data.selectedComplexIds?.map(id => parseInt(id)) || [];
    const updatedComplexes = complexesQuery.data?.filter(complex =>
      selectedIds.includes(complex.id)
    ).map(complex => ({
      ...complex,
      selected: true
    })) || [];
    setSelectedComplexes(updatedComplexes);
    setSelectedComplexIds(selectedIds);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setLogo(file);

    try {
      const Vibrant = (await import('node-vibrant')).default;
      const v = new Vibrant(objectUrl);
      const palette = await v.getPalette();

      if (palette.Vibrant) {
        setPrimaryColor(palette.Vibrant.hex);
        console.log('Primary color extracted:', palette.Vibrant.hex);
      }

      if (palette.LightVibrant) {
        setSecondaryColor(palette.LightVibrant.hex);
        console.log('Secondary color (Light Vibrant) extracted:', palette.LightVibrant.hex);
      } else if (palette.Muted) {
        setSecondaryColor(palette.Muted.hex);
        console.log('Secondary color (Muted) extracted:', palette.Muted.hex);
      }

      toast({
        title: "Colors extracted",
        description: "Brand colors have been updated based on your logo.",
      });
    } catch (error) {
      console.error('Color extraction error:', error);
      toast({
        title: "Error",
        description: "Failed to extract colors from the logo. Please try a different image.",
        variant: "destructive",
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1,
    multiple: false
  });

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateTab('prev')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h3 className="text-lg font-semibold">Event Settings</h3>
        </div>
        <Button variant="outline" onClick={() => handleCreateEvent()}>
          Create Event
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-4">Event Branding</h4>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2">
                {previewUrl ? (
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
    </div>
  );

  const renderComplexesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateTab('prev')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h3 className="text-lg font-semibold">Select Complexes for Event</h3>
        </div>
        <Button variant="outline" onClick={() => navigateTab('next')}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ComplexSelector
            selectedComplexes={selectedComplexes.map(complex => complex.id)}
            onComplexSelect={(ids) => {
              const selectedComplexData = complexesQuery.data?.filter(complex =>
                ids.includes(complex.id)
              ).map(complex => ({
                ...complex,
                selected: true
              })) || [];
              setSelectedComplexes(selectedComplexData);
              setSelectedComplexIds(ids);
            }}
          />
        </CardContent>
      </Card>

      {selectedComplexes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {selectedComplexes.map((complex) => (
            <Card key={complex.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold">{complex.name}</h4>
                  <p className="text-sm text-gray-500">{complex.address}</p>
                  <p className="text-sm text-gray-500">{complex.city}, {complex.state}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewFields(complex.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge variant={complex.isOpen ? "outline" : "destructive"}>
                  {complex.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewingComplexId} onOpenChange={(open) => !open && setViewingComplexId(null)}>
        <DialogContent className="max-w-3xl" aria-describedby="dialog-description">
  <div id="dialog-description" className="sr-only">Field details and configuration options</div>
          <DialogHeader>
            <DialogTitle>
              Fields in {complexesQuery.data?.find(c => c.id === viewingComplexId)?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {fieldsQuery.isLoading ? (
              <div>Loading fields...</div>
            ) : !fieldsQuery.data?.length ? (
              <div>No fields available in this complex</div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead className="text-center">Features</TableHead>
                      <TableHead>Special Instructions</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Event Field Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldsQuery.data.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            {field.hasLights && <Badge variant="secondary">Lights</Badge>}
                            {field.hasParking && <Badge variant="secondary">Parking</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{field.specialInstructions || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={field.isOpen ? "outline" : "destructive"}>
                            {field.isOpen ? "Open" : "Closed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={eventFieldSizes[field.id] || ''}
                            onValueChange={(value: FieldSize) => {
                              setEventFieldSizes(prev => ({
                                ...prev,
                                [field.id]: value
                              }));
                            }}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const handleCreateEvent = async () => {
    try {
      if (!selectedScopeId) {
        toast({
          title: "Error",
          description: "Please select a seasonal scope first",
          variant: "destructive",
        });
        return;
      }

      if (selectedAgeGroupIds.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one age group from the chosen seasonal scope",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);
      const formValues = form.getValues();
      const selectedScope = seasonalScopesQuery.data?.find(scope => scope.id === selectedScopeId);
      const selectedAgeGroups = selectedScope?.ageGroups.filter(group =>
        selectedAgeGroupIds.includes(group.id)
      ) || [];

      // Prepare event data
      const eventData = {
        name: formValues.name || "",
        startDate: formValues.startDate || "",
        endDate: formValues.endDate || "",
        timezone: formValues.timezone || "",
        applicationDeadline: formValues.applicationDeadline || "",
        details: formValues.details || "",
        agreement: formValues.agreement || "",
        refundPolicy: formValues.refundPolicy || "",
        ageGroups: selectedAgeGroups.map(group => ({
          id: generateId(),
          gender: group.gender as "Male" | "Female" | "Coed",
          projectedTeams: 20,
          birthDateStart: new Date(group.minBirthYear, 0, 1).toISOString(),
          birthDateEnd: new Date(group.maxBirthYear, 11, 31).toISOString(),
          scoringRule: scoringRules[0]?.id || '',
          ageGroup: group.ageGroup,
          fieldSize: "11v11" as FieldSize,
          amountDue: 0
        })),
        complexFieldSizes: eventFieldSizes,
        selectedComplexIds: selectedComplexes.map(complex => complex.id),
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: previewUrl || undefined,
        }
      };

      // Validate the event data with seasonal scope context
      const validation = validateEventData(eventData, selectedScopeId, selectedAgeGroupIds);
      if (!validation.isValid) {
        throw new Error(`Validation failed:\n${validation.errors.join('\n')}`);
      }

      // Create FormData instance
      const formData = new FormData();
      if (logo) {
        formData.append('logo', logo);
      }
      formData.append('data', JSON.stringify(eventData));

      // Log the data being sent
      console.log('Submitting event data:', eventData);

      // Validate required event data before making request
      if (!selectedScopeId) {
        throw new Error("Please select a seasonal scope first");
      }

      if (selectedAgeGroupIds.length === 0) {
        throw new Error("Please select at least one age group from the chosen seasonal scope");
      }

      if (!eventData.name || !eventData.startDate || !eventData.endDate || !eventData.timezone || !eventData.applicationDeadline) {
        throw new Error("Please fill in all required event information fields");
      }

      if (selectedComplexIds.length === 0) {
        throw new Error("Please select at least one complex for the event");
      }

      // Ensure age groups are selected
      if (!selectedAgeGroupIds.length) {
        throw new Error("Please select at least one age group from the chosen seasonal scope");
      }

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event. Please check all required fields.');
      }

      toast({
        title: "Success",
        description: "Event created successfully! Redirecting to dashboard...",
        variant: "default",
      });

      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const validateTabs = () => {
      const formValues = form.getValues();
      const errors: Record<EventTab, boolean> = {
        information: !formValues.name || !formValues.startDate || !formValues.endDate || !formValues.timezone || !formValues.applicationDeadline,
        'age-groups': !selectedScopeId || selectedAgeGroupIds.length === 0,
        scoring: scoringRules.length === 0,
        complexes: selectedComplexIds.length === 0,
        settings: false,
        administrators: false,
      };
      setTabErrors(errors);
    };

    validateTabs();
    form.watch(validateTabs);
  }, [form, selectedScopeId, selectedAgeGroupIds, scoringRules, selectedComplexIds]);

  const renderAgeGroupsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateTab('prev')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h3 className="text-lg font-semibold">Select Age Groups</h3>
        </div>
        <Button variant="outline" onClick={() => navigateTab('next')}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label>Select Seasonal Scope</Label>
              <Select
                value={selectedScopeId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedScopeId(parseInt(value));
                  setSelectedAgeGroupIds([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a seasonal scope" />
                </SelectTrigger>
                <SelectContent>
                  {seasonalScopesQuery.data?.map((scope) => (
                    <SelectItem key={scope.id} value={scope.id.toString()}>
                      {scope.name} ({scope.startYear}-{scope.endYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedScopeId && (
              <div className="border rounded-lg p-4 mt-4">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedAgeGroupIds.length === seasonalScopesQuery.data?.find(scope => scope.id === selectedScopeId)?.ageGroups.length}
                      onCheckedChange={(checked) => {
                        const scope = seasonalScopesQuery.data?.find(scope => scope.id === selectedScopeId);
                        if (!scope) return;
                        setSelectedAgeGroupIds(checked ? scope.ageGroups.map(group => group.id) : []);
                      }}
                    />
                    <Label htmlFor="select-all">Select All</Label>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Birth Year</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Division Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasonalScopesQuery.data
                      ?.find(scope => scope.id === selectedScopeId)
                      ?.ageGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAgeGroupIds.includes(group.id)}
                              onCheckedChange={(checked) => {
                                setSelectedAgeGroupIds(prev =>
                                  checked
                                    ? [...prev, group.id]
                                    : prev.filter(id => id !== group.id)
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell>{group.ageGroup}</TableCell>
                          <TableCell>{group.birthYear}</TableCell>
                          <TableCell>{group.gender}</TableCell>
                          <TableCell>{group.divisionCode}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInformationTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Event Information</h3>
        <Button variant="outline" onClick={() => navigateTab('next')}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
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
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
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
                    name="applicationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Deadline</FormLabel>
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
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Details</FormLabel>
                      <FormControl>
                        <Editor
                          value={field.value}
                          onEditorChange={(content) => field.onChange(content)}
                          init={{
                            height: 300,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                              'bold italic forecolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | help',
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
                      <FormLabel>Terms & Agreement</FormLabel>
                      <FormControl>
                        <Editor
                          value={field.value}
                          onEditorChange={(content) => field.onChange(content)}
                          init={{
                            height: 200,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                              'bold italic forecolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | help',
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
                          value={field.value}
                          onEditorChange={(content) => field.onChange(content)}
                          init={{
                            height: 200,
                            menubar: false,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                              'bold italic forecolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | help',
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );

  const renderScoringTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateTab('prev')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h3 className="text-lg font-semibold">Scoring Rules</h3>
        </div>
        <Button onClick={() => {
          scoringForm.reset();
          setIsScoringModalOpen(true);
          setEditingScoringRule(null);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Rule
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead className="text-center">Win</TableHead>
                <TableHead className="text-center">Tie</TableHead>
                <TableHead className="text-center">Loss</TableHead>
                <TableHead className="text-center">Goal Cap</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoringRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No scoring rules created yet
                  </TableCell>
                </TableRow>
              ) : (
                scoringRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.title}</TableCell>
                    <TableCell className="text-center">{rule.win}</TableCell>
                    <TableCell className="text-center">{rule.tie}</TableCell>
                    <TableCell className="text-center">{rule.loss}</TableCell>
                    <TableCell className="text-center">{rule.goalCapped}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditScoringRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteScoringRule(rule.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Age Group Scoring Rules</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Field Size</TableHead>
                  <TableHead>Current Rule</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ageGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No age groups created yet. Create age groups first to assign scoring rules.
                    </TableCell>
                  </TableRow>
                ) : (
                  ageGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.ageGroup}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{group.gender}</Badge>
                      </TableCell>
                      <TableCell>{group.fieldSize}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Select
                            value={group.scoringRule || "none"}
                            onValueChange={(value) => {
                              setAgeGroups(groups =>
                                groups.map(g =>
                                  g.id === group.id
                                    ? { ...g, scoringRule: value === "none" ? null : value }
                                    : g
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select a rule" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Rule</SelectItem>
                              {scoringRules.map((rule) => (
                                <SelectItem key={rule.id} value={rule.id}>
                                  {rule.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={() => navigateTab('next')}>Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Create Event</h2>
      </div>

      <Card className="mx-auto bg-white shadow-lg rounded-lg">
        <CardContent className="p-6">
          <ProgressIndicator
            tabs={TAB_ORDER}
            completedTabs={TAB_ORDER.filter(tab => !tabErrors[tab])}
          />
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as EventTab)}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-6 gap-4">
              {TAB_ORDER.map((tab, index) => {
                const isComplete = !tabErrors[tab];
                return (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={`relative flex items-center justify-center gap-2 ${
                      isComplete ? 'text-[#43A047]' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm
                        ${isComplete ? 'bg-[#43A047] text-white' : 'bg-gray-200'}`}>
                        {index + 1}
                      </span>
                      {tab.replace('-', ' ').charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                    </span>
                    {isComplete && (
                      <svg className="w-4 h-4 text-[#43A047]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="information">
              {renderInformationTab()}
            </TabsContent>

            <TabsContent value="age-groups">
              {renderAgeGroupsTab()}
            </TabsContent>

            <TabsContent value="scoring">
              {renderScoringTab()}
            </TabsContent>

            <TabsContent value="complexes">
              {renderComplexesTab()}
            </TabsContent>

            <TabsContent value="settings">
              {renderSettingsTab()}
            </TabsContent>

            <TabsContent value="administrators">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Event Administrators</h3>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => navigate("/admin/events")}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent}>
                    Finish & Create Event
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}