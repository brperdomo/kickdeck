import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from 'react-dropzone';
import EventAdminModal from "@/components/events/EventAdminModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BracketsContent } from "@/components/admin/brackets/BracketsContent";
import { Editor } from "@tinymce/tinymce-react";
import { AgeGroupEligibilityManager } from "@/components/admin/age-groups/AgeGroupEligibilityManager";
import { StripeConnectBankingView } from "@/components/admin/StripeConnectBankingView";
import ScoringRulesTab from "@/components/admin/scoring/ScoringRulesTab";

// TinyMCE API key from environment variable
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

// Enhanced TinyMCE configuration with HTML editing support
const TINYMCE_HTML_CONFIG = {
  height: 300,
  menubar: 'file edit view insert format tools table help',
  plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount code fullscreen preview',
  toolbar: 'code | undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
  base_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.3',
  suffix: '.min',
  extended_valid_elements: '*[*]', // Allow all elements and attributes
  valid_children: '+body[style]', // Allow style tag in body
  schema: 'html5',
  entity_encoding: 'raw',
  verify_html: false, // Don't verify/filter HTML
  valid_elements: '*[*]' // Allow all elements and attributes
};

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
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues
  });

  const [selectedSeasonalScopeId, setSelectedSeasonalScopeId] = useState<number | null>(
    defaultValues?.seasonalScopeId || null
  );
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(defaultValues?.ageGroups || []);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(defaultValues?.scoringRules || []);
  const [settings, setSettings] = useState<EventSetting[]>(defaultValues?.settings || []);
  const [isScoringDialogOpen, setIsScoringDialogOpen] = useState(false);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<EventSetting | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminModalProps['adminToEdit']>(null);
  const [logo, setLogo] = useState<File | null>(null);
  // Log the default values for branding to help debug issues
  console.log('EventForm initializing with branding values:', {
    logoUrl: defaultValues?.branding?.logoUrl,
    primaryColor: defaultValues?.branding?.primaryColor,
    secondaryColor: defaultValues?.branding?.secondaryColor
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValues?.branding?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(defaultValues?.branding?.primaryColor || '#007AFF');
  const [secondaryColor, setSecondaryColor] = useState(defaultValues?.branding?.secondaryColor || '#34C759');
  
  // Add effect to update branding values when defaultValues change
  useEffect(() => {
    console.log('defaultValues changed, updating branding colors:', {
      primaryColor: defaultValues?.branding?.primaryColor,
      secondaryColor: defaultValues?.branding?.secondaryColor
    });
    
    if (defaultValues?.branding?.primaryColor) {
      setPrimaryColor(defaultValues.branding.primaryColor);
      // Update form state to ensure branding colors persist
      form.setValue('branding.primaryColor', defaultValues.branding.primaryColor, { 
        shouldDirty: false,
        shouldValidate: false 
      });
    }
    
    if (defaultValues?.branding?.secondaryColor) {
      setSecondaryColor(defaultValues.branding.secondaryColor);
      // Update form state to ensure branding colors persist
      form.setValue('branding.secondaryColor', defaultValues.branding.secondaryColor, { 
        shouldDirty: false,
        shouldValidate: false 
      });
    }
    
    if (defaultValues?.branding?.logoUrl) {
      setPreviewUrl(defaultValues.branding.logoUrl);
      // Update form state to ensure branding logo persists
      form.setValue('branding.logoUrl', defaultValues.branding.logoUrl, { 
        shouldDirty: false,
        shouldValidate: false 
      });
    }
    
    // Ensure the branding object itself exists in form values
    form.setValue('branding', {
      ...(form.getValues('branding') || {}),
      primaryColor: defaultValues?.branding?.primaryColor || '#007AFF',
      secondaryColor: defaultValues?.branding?.secondaryColor || '#34C759',
      logoUrl: defaultValues?.branding?.logoUrl || ''
    }, { 
      shouldDirty: false,
      shouldValidate: false 
    });
  }, [defaultValues?.branding, form]);
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

  // For fetching age groups by seasonal scope
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
  
  // For fetching existing event's age groups in edit mode
  const eventAgeGroupsQuery = useQuery({
    queryKey: ['/api/admin/events/age-groups', defaultValues?.id],
    queryFn: async () => {
      if (!defaultValues?.id) return [];
      console.log('Fetching event age groups for event:', defaultValues.id);
      const response = await fetch(`/api/admin/events/${defaultValues.id}/age-groups`);
      if (!response.ok) {
        throw new Error('Failed to fetch event age groups');
      }
      
      const data = await response.json();
      console.log('Event age groups loaded:', data);
      return data;
    },
    enabled: !!defaultValues?.id && mode === 'edit'
  });

  // For fetching eligibility settings in edit mode
  const eligibilitySettingsQuery = useQuery({
    queryKey: ['ageGroupEligibilitySettings', defaultValues?.id],
    queryFn: async () => {
      if (!defaultValues?.id) return [];
      console.log('Fetching eligibility settings for event:', defaultValues.id);
      const response = await fetch(`/api/admin/age-group-eligibility-settings/event/${defaultValues.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch age group eligibility settings");
      }
      
      const data = await response.json();
      console.log('Eligibility settings loaded:', data);
      return data;
    },
    enabled: !!defaultValues?.id && mode === 'edit'
  });
  
  // This query was merged with the one below

  // Effect for initializing seasonal scope ID from defaultValues
  useEffect(() => {
    if (defaultValues?.seasonalScopeId) {
      console.log('Setting initial seasonal scope ID from defaultValues:', defaultValues.seasonalScopeId);
      // Convert to number to ensure proper type for the select component
      const scopeId = typeof defaultValues.seasonalScopeId === 'string' 
        ? parseInt(defaultValues.seasonalScopeId) 
        : defaultValues.seasonalScopeId;
        
      setSelectedSeasonalScopeId(scopeId);
      
      // Also set the seasonalScopeId in the form
      form.setValue('seasonalScopeId', scopeId);

      // If in edit mode and we have a scope ID, also immediately fetch its age groups
      if (mode === 'edit' && scopeId) {
        const fetchAgeGroups = async () => {
          try {
            const response = await fetch(`/api/admin/seasonal-scopes/${scopeId}/age-groups`);
            if (response.ok) {
              const ageGroupsData = await response.json();
              console.log('Fetched age groups from scope on initial load:', ageGroupsData);
              
              // Format age groups for the form
              const formattedAgeGroups = ageGroupsData.map((group: any) => {
                const ageGroupValue = group.ageGroup || group.age_group || group.name || '';
                
                let fieldSize = group.fieldSize || group.field_size || '11v11';
                if (!fieldSize && ageGroupValue && typeof ageGroupValue === 'string' && ageGroupValue.startsWith('U')) {
                  const ageNumber = parseInt(ageGroupValue.substring(1));
                  if (!isNaN(ageNumber)) {
                    fieldSize = ageNumber <= 7 ? '4v4' :
                               ageNumber <= 10 ? '7v7' :
                               ageNumber <= 12 ? '9v9' : '11v11';
                  }
                }
                
                return {
                  id: `${group.gender}-${group.birthYear}-${ageGroupValue}`,
                  ageGroup: ageGroupValue,
                  birthYear: group.birthYear,
                  gender: group.gender,
                  divisionCode: group.divisionCode,
                  fieldSize: fieldSize,
                  selected: true
                };
              });
              
              // Update age groups state and form value
              setAgeGroups(formattedAgeGroups);
              form.setValue('ageGroups', formattedAgeGroups);
            }
          } catch (error) {
            console.error('Error fetching age groups for initial scope:', error);
          }
        };
        fetchAgeGroups();
      }
    }
  }, [defaultValues?.seasonalScopeId, form, mode]);

  useEffect(() => {
    // Prioritize event age groups over seasonal scope age groups when in edit mode
    const sourceData = (mode === 'edit' && eventAgeGroupsQuery.data) || ageGroupsQuery.data;
    
    if (sourceData) {
      console.log('Formatting age groups from source:', { mode, sourceData });
      
      // Format and update age groups from query
      const formattedGroups = sourceData.map((group: any) => {
        console.log('Processing age group:', group);
        
        // Safely get ageGroup field (could be ageGroup, age_group, or similar)
        const ageGroupValue = group.ageGroup || group.age_group || group.name || '';
        
        // Calculate field size safely
        let fieldSize = group.fieldSize || group.field_size || '11v11';
        if (!fieldSize && ageGroupValue && typeof ageGroupValue === 'string' && ageGroupValue.startsWith('U')) {
          const ageNumber = parseInt(ageGroupValue.substring(1));
          if (!isNaN(ageNumber)) {
            fieldSize = ageNumber <= 7 ? '4v4' :
                       ageNumber <= 10 ? '7v7' :
                       ageNumber <= 12 ? '9v9' : '11v11';
          }
        }
        
        return {
          id: group.id || `${group.gender}-${group.birthYear}-${ageGroupValue}`,
          ageGroup: ageGroupValue,
          birthYear: group.birthYear || group.birth_year,
          gender: group.gender,
          divisionCode: group.divisionCode || group.division_code,
          fieldSize: fieldSize,
          isEligible: group.isEligible !== undefined ? group.isEligible : true,
          selected: true
        };
      });
      
      console.log('Formatted age groups:', formattedGroups);
      setAgeGroups(formattedGroups);
      form.setValue('ageGroups', formattedGroups);
      
      // Apply eligibility settings if available
      if (eligibilitySettingsQuery.data?.length > 0) {
        console.log('Applying eligibility settings to age groups', {
          formattedGroups,
          eligibilitySettings: eligibilitySettingsQuery.data
        });
        
        // Create a map of age group IDs to eligibility status
        const eligibilityMap = new Map();
        eligibilitySettingsQuery.data.forEach((setting: any) => {
          eligibilityMap.set(setting.ageGroupId, setting.isEligible);
        });
        
        // Update the age groups with eligibility settings
        const updatedGroups = formattedGroups.map(group => {
          if (eligibilityMap.has(group.id)) {
            return { ...group, isEligible: eligibilityMap.get(group.id) };
          }
          return group;
        });
        
        console.log('Updated age groups with eligibility settings', updatedGroups);
        setAgeGroups(updatedGroups);
        form.setValue('ageGroups', updatedGroups);
      }
    }
  }, [ageGroupsQuery.data, eventAgeGroupsQuery.data, eligibilitySettingsQuery.data, form, mode]);

  const handleSeasonalScopeChange = async (scopeId: number) => {
    setSelectedSeasonalScopeId(scopeId);
    form.setValue('seasonalScopeId', scopeId);
    
    // Immediately fetch age groups when seasonal scope changes
    try {
      const response = await fetch(`/api/admin/seasonal-scopes/${scopeId}/age-groups`);
      if (response.ok) {
        const ageGroupsData = await response.json();
        
        // Convert to the expected age group format with proper field sizes
        const formattedAgeGroups = ageGroupsData.map((group: any) => {
          const ageGroupValue = group.ageGroup || group.age_group || group.name || '';
          
          let fieldSize = group.fieldSize || group.field_size || '11v11';
          if (!fieldSize && ageGroupValue && typeof ageGroupValue === 'string' && ageGroupValue.startsWith('U')) {
            const ageNumber = parseInt(ageGroupValue.substring(1));
            if (!isNaN(ageNumber)) {
              fieldSize = ageNumber <= 7 ? '4v4' :
                         ageNumber <= 10 ? '7v7' :
                         ageNumber <= 12 ? '9v9' : '11v11';
            }
          }
          
          return {
            id: `${group.gender}-${group.birthYear}-${ageGroupValue}`,
            ageGroup: ageGroupValue,
            birthYear: group.birthYear,
            gender: group.gender,
            divisionCode: group.divisionCode,
            fieldSize: fieldSize,
            selected: true
          };
        });
        
        // Update age groups state and form value
        setAgeGroups(formattedAgeGroups);
        form.setValue('ageGroups', formattedAgeGroups);
        
        console.log(`Loaded ${formattedAgeGroups.length} age groups for scope ${scopeId}`);
      }
    } catch (error) {
      console.error('Error fetching age groups for scope:', error);
      toast({
        title: "Error",
        description: "Failed to load age groups for the selected seasonal scope",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (data: EventFormValues) => {
    try {
      // Check if age groups already exist, we don't need to validate the seasonal scope
      // as the age groups are already associated with the event
      const hasExistingAgeGroups = ageGroups && ageGroups.length > 0;
      
      // Only validate the seasonal scope if no age groups exist yet
      if (!hasExistingAgeGroups) {
        // Get seasonalScopeId from selectedSeasonalScopeId or from form data (which may have been set from defaultValues)
        const effectiveScopeId = selectedSeasonalScopeId || data.seasonalScopeId || defaultValues?.seasonalScopeId;
        
        if (!effectiveScopeId) {
          toast({
            title: "Error",
            description: "Please select a seasonal scope",
            variant: "destructive"
          });
          return;
        }
      }

      // Determine the scope ID to use:
      // 1. Use the original scope ID from defaultValues if we have age groups already 
      // 2. Otherwise use the selected scope ID or form value
      const scopeIdToSubmit = hasExistingAgeGroups && defaultValues?.seasonalScopeId
        ? defaultValues.seasonalScopeId
        : selectedSeasonalScopeId || data.seasonalScopeId || defaultValues?.seasonalScopeId;
      
      console.log('Seasonal scope debug info:', {
        hasExistingAgeGroups,
        selectedSeasonalScopeId,
        'data.seasonalScopeId': data.seasonalScopeId,
        'defaultValues.seasonalScopeId': defaultValues?.seasonalScopeId,
        scopeIdToSubmit
      });
      
      // Make sure branding values are also present in settings array
      // Create a new settings array with updated branding values
      const updatedSettings = [...settings];
      
      // Helper function to find or create a setting
      const findOrCreateSetting = (key: string, value: string) => {
        const existingIndex = updatedSettings.findIndex(s => s.key === key);
        if (existingIndex >= 0) {
          // Update existing setting
          updatedSettings[existingIndex] = {
            ...updatedSettings[existingIndex],
            value: value
          };
        } else {
          // Add new setting
          updatedSettings.push({
            key,
            value,
            id: undefined // Backend will assign an ID
          });
        }
      };
      
      // Make sure branding colors get properly synced in settings
      console.log('Syncing branding settings before submit:', {
        primaryColor, 
        secondaryColor, 
        logoUrl: previewUrl,
        formLogoUrl: form.getValues('branding.logoUrl')
      });
      
      // Ensure we use the form value for logo URL if it exists
      const formLogoUrl = form.getValues('branding.logoUrl');
      const finalLogoUrl = formLogoUrl || previewUrl;
      
      console.log('Logo URL being used for submission:', finalLogoUrl);
      
      // Update settings with current branding values
      findOrCreateSetting('branding.primaryColor', primaryColor);
      findOrCreateSetting('branding.secondaryColor', secondaryColor);
      if (finalLogoUrl) {
        findOrCreateSetting('branding.logoUrl', finalLogoUrl);
      }
      
      const submitData = {
        ...data,
        seasonalScopeId: scopeIdToSubmit,
        // CONSTRAINT SAFE: Remove age groups from event update to prevent violations
        // Age group eligibility is handled separately through dedicated endpoints
        // ageGroups: undefined, // Don't include age groups in main event update
        scoringRules,
        settings: updatedSettings, // Use the updated settings
        complexFieldSizes,
        selectedComplexIds,
        administrators: defaultValues?.administrators || [],
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: finalLogoUrl || undefined,
        },
      };

      await onSubmit(submitData);
      toast({
        title: "Success",
        description: mode === 'edit' ? "Event updated successfully. You can continue editing." : "Event created successfully",
      });
      // Only redirect to admin dashboard if creating a new event, not when editing
      if (mode === 'create') {
        setLocation("/admin");
      }
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
  
  const feeAssignmentsQuery = useQuery({
    queryKey: ['eventFeeAssignments', defaultValues?.id],
    queryFn: async () => {
      if (!defaultValues?.id) return [];
      const response = await fetch(`/api/admin/events/${defaultValues.id}/fee-assignments`);
      if (!response.ok) {
        throw new Error("Failed to fetch fee assignments");
      }
      return response.json();
    },
    enabled: !!defaultValues?.id
  });
  
  // The eligibility settings query is already defined above

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      try {
        const file = acceptedFiles[0];
        setLogo(file);
        
        // Show local preview immediately for better UX
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);

        // Upload the file to the server
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload logo');
        }

        const uploadResult = await response.json();
        
        // Update the preview URL with the server URL (which will be persisted)
        setPreviewUrl(uploadResult.url);
        
        // Update the form state with the new logo URL
        form.setValue('branding.logoUrl', uploadResult.url, { 
          shouldDirty: true,
          shouldValidate: false 
        });
        
        // Log the form values after updating to confirm the change
        console.log('Logo updated in form:', {
          logoUrl: uploadResult.url, 
          formValue: form.getValues('branding.logoUrl')
        });
        
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        });
      } catch (error) {
        console.error('Logo upload error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload logo",
          variant: "destructive",
        });
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1,
    multiple: false
  });

  const renderAgeGroupsContent = (mode: 'create' | 'edit', ageGroups: AgeGroup[], seasonalScopesQuery: any, selectedSeasonalScopeId: number | null, handleSeasonalScopeChange: (id: number) => void) => (
    <div className="space-y-6">
      {/* Only show seasonal scope selector in create mode or if no age groups exist */}
      {(mode === 'create' || (mode === 'edit' && (!ageGroups || ageGroups.length === 0))) && (
        <div className="mb-6">
          <Label htmlFor="seasonalScope">Seasonal Scope</Label>
          <Select 
            onValueChange={(value) => handleSeasonalScopeChange(Number(value))}
            value={selectedSeasonalScopeId ? selectedSeasonalScopeId.toString() : undefined}
            defaultValue={selectedSeasonalScopeId ? selectedSeasonalScopeId.toString() : undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a seasonal scope" />
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
      )}
      
      {/* Display the selected scope information when scope is selected or age groups exist */}
      {((mode === 'edit' && ageGroups && ageGroups.length > 0) || selectedSeasonalScopeId || defaultValues?.seasonalScopeId) && seasonalScopesQuery.data && (
        <div className="mb-6">
          <div className="font-medium text-sm mb-2">Selected Seasonal Scope</div>
          <div className="bg-muted p-3 rounded-md">
            {(() => {
              // Get the effective scope ID from any available source
              const effectiveScopeId = selectedSeasonalScopeId || 
                (typeof defaultValues?.seasonalScopeId === 'string' 
                  ? parseInt(defaultValues.seasonalScopeId) 
                  : defaultValues?.seasonalScopeId);
              
              const scope = seasonalScopesQuery.data.find((s: any) => s.id === effectiveScopeId);
              
              if (scope) {
                return `${scope.name} (${scope.startYear}-${scope.endYear})`;
              } else {
                return 'Scope ID: ' + (effectiveScopeId || 'Unknown');
              }
            })()}
          </div>
        </div>
      )}

      {(selectedSeasonalScopeId || (ageGroups && ageGroups.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Age Groups</CardTitle>
            <CardDescription>
              {mode === 'create' 
                ? "All age groups from this seasonal scope will be automatically included in the event."
                : "Age groups included in this event"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Age groups configured automatically
                  </h3>
                  <p className="mt-2 text-sm text-green-700">
                    All {ageGroups.length} age groups {mode === 'create' ? 'will be' : 'are'} included in your event.
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
                  <TableHead>Field Size</TableHead>
                  <TableHead>Assigned Fees</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead className="text-center">
                    <div>Eligible for Registration</div>
                    <div className="text-xs font-normal text-muted-foreground mt-1">Toggle to enable/disable registration for this age group</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ageGroups.map((group) => {
                  // Find fee assignments for this age group
                  const groupAssignments = feeAssignmentsQuery.data?.filter(
                    (assignment: any) => assignment.ageGroupId === group.id
                  ) || [];
                  
                  // Calculate total fee amount
                  // Format currency to display dollars instead of cents
                  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;
                  
                  const totalFee = groupAssignments.reduce((sum: number, assignment: any) => {
                    const fee = feesQuery.data?.find((f: any) => f.id === assignment.feeId);
                    return sum + (fee?.amount || 0);
                  }, 0);
                  
                  // Get fee names
                  const feeNames = groupAssignments.map((assignment: any) => {
                    const fee = feesQuery.data?.find((f: any) => f.id === assignment.feeId);
                    return fee?.name || 'Unknown Fee';
                  });
                  
                  return (
                    <TableRow key={`${group.gender}-${group.birthYear}-${group.ageGroup}`}>
                      <TableCell>{group.ageGroup}</TableCell>
                      <TableCell>{group.gender}</TableCell>
                      <TableCell>{group.birthYear}</TableCell>
                      <TableCell>{group.divisionCode}</TableCell>
                      <TableCell>
                        <Select
                          value={group.fieldSize || "11v11"}
                          onValueChange={async (value) => {
                            // Update local state immediately without re-sorting
                            // This preserves the original order while only updating the field size
                            const updatedAgeGroups = ageGroups.map(ag => 
                              ag.id === group.id 
                                ? { ...ag, fieldSize: value } 
                                : ag
                            );
                            
                            setAgeGroups(updatedAgeGroups);
                            form.setValue('ageGroups', updatedAgeGroups);
                            
                            // Save to database if we're in edit mode and have a valid age group ID
                            if (mode === 'edit' && group.id && defaultValues?.id) {
                              try {
                                const response = await fetch(`/api/admin/age-groups/${group.id}/field-size`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  credentials: 'include',
                                  body: JSON.stringify({ fieldSize: value }),
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to update field size');
                                }
                                
                                console.log(`Successfully saved field size ${value} for age group ${group.id}`);
                              } catch (error) {
                                console.error('Error saving field size:', error);
                                toast({
                                  title: "Warning",
                                  description: "Field size updated locally but failed to save to database. Please save the event to persist changes.",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select field size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4v4">4v4</SelectItem>
                            <SelectItem value="7v7">7v7</SelectItem>
                            <SelectItem value="9v9">9v9</SelectItem>
                            <SelectItem value="11v11">11v11</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {feeNames.length > 0 
                          ? feeNames.join(', ') 
                          : <span className="text-muted-foreground">No fees assigned</span>}
                      </TableCell>
                      <TableCell>
                        {totalFee > 0 
                          ? formatCurrency(totalFee) 
                          : <span className="text-muted-foreground">$0.00</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={group.isEligible !== false}
                          onCheckedChange={async (checked) => {
                            // Update the local state
                            const updatedAgeGroups = ageGroups.map(ag => 
                              ag.id === group.id 
                                ? { ...ag, isEligible: checked } 
                                : ag
                            );
                            setAgeGroups(updatedAgeGroups);
                            form.setValue('ageGroups', updatedAgeGroups);
                            
                            // Save to the backend if we're in edit mode with a valid event ID
                            if (mode === 'edit' && defaultValues?.id) {
                              try {
                                const eligibilityValue = Boolean(checked);
                                const eventId = defaultValues.id;
                                console.log(`Saving eligibility for age group ${group.id}: ${eligibilityValue} in event ${eventId}`);
                                
                                // Call the age group eligibility settings API to update the eligibility
                                const response = await fetch(`/api/admin/age-group-eligibility-settings/${group.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    isEligible: eligibilityValue,
                                    eventId: eventId
                                  })
                                });
                                
                                if (!response.ok) {
                                  throw new Error(`Failed to update eligibility: ${response.statusText}`);
                                }
                                
                                // Invalidate the eligibility settings query to refresh the data
                                queryClient.invalidateQueries({
                                  queryKey: ['ageGroupEligibilitySettings', eventId]
                                });
                                
                                console.log(`Successfully updated eligibility for age group ${group.id}`);
                                
                                // Show success toast
                                toast({
                                  title: "Eligibility updated",
                                  description: `${group.ageGroup} (${group.gender}) is now ${checked ? 'eligible' : 'ineligible'} for registration.`,
                                  variant: "default"
                                });
                              } catch (error) {
                                console.error('Error updating age group eligibility:', error);
                                toast({
                                  title: "Error updating eligibility",
                                  description: "The change couldn't be saved to the server. Please try again.",
                                  variant: "destructive"
                                });
                                
                                // Revert the local state if the server update failed
                                const revertedAgeGroups = ageGroups.map(ag => 
                                  ag.id === group.id 
                                    ? { ...ag, isEligible: !checked } 
                                    : ag
                                );
                                setAgeGroups(revertedAgeGroups);
                                form.setValue('ageGroups', revertedAgeGroups);
                              }
                            }
                          }}
                          aria-label={`Age group ${group.ageGroup} eligibility toggle`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {ageGroups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No age groups found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                <Input 
                  type="date" 
                  {...field} 
                  value={field.value ? (field.value.includes('T') ? field.value.split('T')[0] : field.value) : ''} 
                />
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
                  apiKey={TINYMCE_API_KEY}
                  value={field.value}
                  onEditorChange={(content) => field.onChange(content)}
                  init={TINYMCE_HTML_CONFIG}
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
                  apiKey={TINYMCE_API_KEY}
                  value={field.value}
                  onEditorChange={(content) => field.onChange(content)}
                  init={TINYMCE_HTML_CONFIG}
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
                  apiKey={TINYMCE_API_KEY}
                  value={field.value}
                  onEditorChange={(content) => field.onChange(content)}
                  init={TINYMCE_HTML_CONFIG}
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

  // Query to get event administrators
  const { data: eventAdmins, isLoading: isLoadingAdmins, refetch: refetchAdmins } = useQuery({
    queryKey: ['event-admins', defaultValues?.id],
    queryFn: async () => {
      if (!defaultValues?.id) return [];
      const response = await fetch(`/api/admin/events/${defaultValues.id}/administrators`);
      if (!response.ok) throw new Error('Failed to fetch event administrators');
      return response.json();
    },
    enabled: !!defaultValues?.id
  });

  const renderAdministratorsContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Event Administrators</h3>
          <Button onClick={() => setIsAdminModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Administrator
          </Button>
        </div>
        
        {isLoadingAdmins ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Loading administrators...</p>
          </div>
        ) : eventAdmins && eventAdmins.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventAdmins.map((admin: any) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      {admin.user.firstName} {admin.user.lastName}
                    </TableCell>
                    <TableCell>{admin.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAdmin({
                            id: admin.id,
                            userId: admin.userId,
                            role: admin.role,
                            permissions: admin.permissions || {}
                          });
                          setIsAdminModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              No administrators have been assigned to this event yet.
              Click the "Add Administrator" button to assign administrators with specific roles and permissions.
            </p>
          </div>
        )}
      </div>
    );
  };

  const getTabValidationState = () => {
    const errors: Record<EventTab, boolean> = {
      'information': false,
      'age-groups': false,
      'scoring': scoringRules.length === 0,
      'complexes': selectedComplexIds.length === 0,
      'settings': false,
      'banking': false,
      'administrators': false,
    };
    return errors;
  };

  const tabErrors = getTabValidationState();

  // Get the "allowPayLater" setting value
  const getAllowPayLaterSetting = () => {
    const payLaterSetting = settings.find(s => s.key === 'allowPayLater');
    return payLaterSetting ? payLaterSetting.value === 'true' : false;
  };
  
  // Function to toggle the "allowPayLater" setting
  const toggleAllowPayLater = (value: boolean) => {
    const updatedSettings = [...settings];
    const existingIndex = updatedSettings.findIndex(s => s.key === 'allowPayLater');
    
    if (existingIndex >= 0) {
      // Update existing setting
      updatedSettings[existingIndex] = {
        ...updatedSettings[existingIndex],
        value: value.toString()
      };
    } else {
      // Add new setting
      updatedSettings.push({
        id: Date.now(), // Temporary ID until saved
        key: 'allowPayLater',
        value: value.toString()
      });
    }
    
    setSettings(updatedSettings);
  };

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
      
      {/* Payment Options Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Options</CardTitle>
          <CardDescription>
            Configure payment settings for this event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Allow Pay Later</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, teams can register without immediate payment
              </p>
            </div>
            <Switch
              checked={getAllowPayLaterSetting()}
              onCheckedChange={toggleAllowPayLater}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Event Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Branding</CardTitle>
          <CardDescription>
            Customize your event's appearance. The logo and colors will be used during the team registration process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div>
            <h4 className="text-sm font-medium mb-4">Event Logo</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-2 rounded-full bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {isDragActive
                        ? "Drop the logo here"
                        : "Drag & drop your event logo here, or click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PNG, JPG, SVG
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                {previewUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={previewUrl}
                      alt="Event logo preview"
                      className="max-h-32 object-contain"
                    />
                    <p className="text-sm text-center">Logo Preview</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-sm">No logo uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Color Pickers */}
          <div>
            <h4 className="text-sm font-medium mb-4">Event Colors</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex mt-2">
                    <div 
                      className="w-10 h-10 rounded border mr-3" 
                      style={{ backgroundColor: primaryColor }}
                    ></div>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        const color = e.target.value;
                        setPrimaryColor(color);
                        form.setValue('branding.primaryColor', color, { 
                          shouldDirty: true,
                          shouldValidate: false 
                        });
                      }}
                      className="w-24 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => {
                        const color = e.target.value;
                        setPrimaryColor(color);
                        form.setValue('branding.primaryColor', color, { 
                          shouldDirty: true,
                          shouldValidate: false 
                        });
                      }}
                      className="ml-2 w-32"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Primary color for branding and theming
                  </p>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex mt-2">
                    <div 
                      className="w-10 h-10 rounded border mr-3" 
                      style={{ backgroundColor: secondaryColor }}
                    ></div>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => {
                        const color = e.target.value;
                        setSecondaryColor(color);
                        form.setValue('branding.secondaryColor', color, { 
                          shouldDirty: true,
                          shouldValidate: false 
                        });
                      }}
                      className="w-24 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => {
                        const color = e.target.value;
                        setSecondaryColor(color);
                        form.setValue('branding.secondaryColor', color, { 
                          shouldDirty: true,
                          shouldValidate: false 
                        });
                      }}
                      className="ml-2 w-32"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Secondary color for accents and highlights
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center p-6 border rounded-lg bg-muted/30">
                <div className="text-sm font-medium mb-3">Color Preview</div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <div
                      className="w-16 h-16 rounded-md shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    ></div>
                    <p className="text-xs text-center">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="w-16 h-16 rounded-md shadow-md"
                      style={{ backgroundColor: secondaryColor }}
                    ></div>
                    <p className="text-xs text-center">Secondary</p>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-md" style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}80 0%, ${secondaryColor}80 100%)`,
                  border: `1px solid ${primaryColor}40`
                }}>
                  <p className="text-sm font-medium text-center">Sample Gradient</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Settings List */}
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
            <TabsList className="w-full grid grid-cols-8 gap-2 mb-6 bg-[#F2F2F7] p-1 rounded-lg">
              {TAB_ORDER.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={`w-full px-2 py-2 rounded-md text-xs font-medium transition-colors
                    data-[state=active]:bg-white data-[state=active]:text-[#007AFF] data-[state=active]:shadow-sm
                    text-[#1C1C1E] hover:text-[#007AFF]`}
                >
                  {tab === 'administrators' 
                    ? 'Admins' 
                    : tab.replace('-', ' ').charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="information">
                {renderInformationContent()}
              </TabsContent>

              <TabsContent value="age-groups">
                {renderAgeGroupsContent(
                  mode,
                  ageGroups,
                  seasonalScopesQuery,
                  selectedSeasonalScopeId,
                  handleSeasonalScopeChange
                )}
              </TabsContent>
              


              <TabsContent value="brackets">
                {mode === 'edit' ? (
                  <BracketsContent />
                ) : (
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <p>You must save the event before managing brackets.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save the event with age groups first, then you can add brackets in edit mode.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scoring">
                {mode === 'edit' && defaultValues?.id ? (
                  <ScoringRulesTab eventId={defaultValues.id.toString()} />
                ) : (
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <p>Save the event first to configure scoring rules.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scoring and standings configuration is available after creating the event.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="complexes">
                {renderComplexesContent()}
              </TabsContent>

              <TabsContent value="settings">
                {renderSettingsContent()}
              </TabsContent>

              <TabsContent value="banking">
                {mode === 'edit' && defaultValues?.id ? (
                  <StripeConnectBankingView eventId={defaultValues.id.toString()} />
                ) : (
                  <div className="p-4 bg-muted/50 rounded-md text-center">
                    <p>Save the event first to set up banking information.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Banking setup is available after creating the event.
                    </p>
                  </div>
                )}
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