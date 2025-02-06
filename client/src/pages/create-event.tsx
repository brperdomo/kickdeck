import { useState, useCallback } from "react";
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

function validateEventData(data: Partial<EventData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = {
    'name': 'Event name',
    'startDate': 'Start date',
    'endDate': 'End date',
    'timezone': 'Time zone',
    'applicationDeadline': 'Application deadline'
  };

  // Check required text fields
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!data[field as keyof typeof data] || data[field as keyof typeof data]?.trim() === '') {
      errors.push(`${label} is required`);
    }
  });

  // Validate dates are in the future
  const now = new Date();
  if (data.startDate && new Date(data.startDate) < now) {
    errors.push("Start date must be in the future");
  }
  if (data.endDate && new Date(data.endDate) < new Date(data.startDate || '')) {
    errors.push("End date must be after start date");
  }
  if (data.applicationDeadline && new Date(data.applicationDeadline) > new Date(data.startDate || '')) {
    errors.push("Application deadline must be before event start date");
  }

  // Check age groups
  if (!data.ageGroups?.length) {
    errors.push("At least one age group is required");
  } else {
    data.ageGroups.forEach((group, index) => {
      if (!group.ageGroup || !group.gender || !group.fieldSize) {
        errors.push(`Age group ${index + 1} is missing required information`);
      }
    });
  }

  // Check complexes
  if (!data.selectedComplexIds?.length) {
    errors.push("At least one complex must be selected");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

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
  selectedComplexIds: z.array(z.string()).min(1, "Select at least one complex")
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
    const selectedIds = data.selectedComplexIds.map(id => parseInt(id));
    const updatedComplexes = complexesQuery.data?.filter(complex =>
      selectedIds.includes(complex.id)
    ).map(complex => ({
      ...complex,
      selected: true
    })) || [];
    setSelectedComplexes(updatedComplexes);
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
        <DialogContent className="max-w-3xl">
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
    setIsSaving(true);
    try {
      const formValues = form.getValues();

      // Validate form values
      const formValidation = form.trigger();
      if (!formValidation) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Validate age groups
      if (!ageGroups.length) {
        toast({
          title: "Validation Error",
          description: "Please add at least one age group",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Validate complex selection
      if (!selectedComplexes.length) {
        toast({
          title: "Validation Error",
          description: "Please select at least one complex",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const eventData = {
        name: formValues.name,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        timezone: formValues.timezone,
        applicationDeadline: formValues.applicationDeadline,
        details: formValues.details || "",
        agreement: formValues.agreement || "",
        refundPolicy: formValues.refundPolicy || "",
        ageGroups: ageGroups.map(({ id, ...rest }) => ({
          ...rest,
          scoringRule: rest.scoringRule || null
        })),
        complexFieldSizes: eventFieldSizes,
        selectedComplexIds: selectedComplexes.map(complex => complex.id),
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: previewUrl,
        }
      };

      // Create FormData instance
      const formData = new FormData();
      if (logo) {
        formData.append('logo', logo);
      }
      formData.append('data', JSON.stringify(eventData));

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Create Event</h2>
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

            <TabsContent value="information">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
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
                        <FormLabel>Details About This Event *</FormLabel>
                        <FormControl>
                          <Editor
                            apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
                            init={{
                              height: 300,
                              menubar: true,
                              document_base_url: 'https://matchpro.replit.app',
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
                        <FormLabel>Agreement *</FormLabel>
                        <FormControl>
                          <Editor
                            apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
                            init={{
                              height: 300,
                              menubar: true,
                              document_base_url: 'https://matchpro.replit.app',
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
                        <FormLabel>Refund Policy *</FormLabel>
                        <FormControl>
                          <Editor
                            apiKey="wysafiugpee0xtyjdnegcq6x43osb81qje582522ekththu8"
                            init={{
                              height: 300,
                              menubar: true,
                              document_base_url: 'https://matchpro.replit.app',
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
                    <Button type="submit">Save & Continue</Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="age-groups">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Age Groups</h3>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingAgeGroup(null);
                        ageGroupForm.reset();
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Age Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAgeGroup ? 'Edit Age Group' : 'Add New Age Group'}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...ageGroupForm}>
                        <form onSubmit={ageGroupForm.handleSubmit(handleAddAgeGroup)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ageGroupForm.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
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
                              control={ageGroupForm.control}
                              name="projectedTeams"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Projected # of Teams</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="200"
                                      className="w-32"
                                      placeholder="0"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FormField
                                control={ageGroupForm.control}
                                name="birthDateStart"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Birth Date Range (Start) *</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <FormField
                                control={ageGroupForm.control}
                                name="birthDateEnd"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Birth Date Range (End) *</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ageGroupForm.control}
                              name="scoringRule"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Scoring Rule</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select scoring rule" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="default">Default Scoring</SelectItem>
                                      {scoringRules.map(rule => (
                                        <SelectItem key={rule.id} value={rule.id}>{rule.title}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={ageGroupForm.control}
                              name="ageGroup"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age Group *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select age group" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 22 }, (_, i) => i + 4).map((age) => (
                                        <SelectItem key={age} value={`U${age}`}>
                                          U{age}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="Open">Open</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ageGroupForm.control}
                              name="fieldSize"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field Size</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
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
                              control={ageGroupForm.control}
                              name="amountDue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount Due (optional)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5">$</span>
                                      <Input
                                        type="number"
                                        className="pl-7"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          field.onChange(value === '' ? null : Number(value));
                                        }}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                setEditingAgeGroup(null);
                                ageGroupForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingAgeGroup ? 'Update Age Group' : 'Add Age Group'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Age Group</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Field Size</TableHead>
                          <TableHead>Birth Date Range</TableHead>
                          <TableHead>Teams</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ageGroups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No age groups added yet
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
                                {new Date(group.birthDateStart).toLocaleDateString()} - {new Date(group.birthDateEnd).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge>{group.projectedTeams} Teams</Badge>
                              </TableCell>
                              <TableCell>
                                {group.amountDue ? `$${group.amountDue.toFixed(2)}` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
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
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => navigateTab('next')}>Save & Continue</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scoring">
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