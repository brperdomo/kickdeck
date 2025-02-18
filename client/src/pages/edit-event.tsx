import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Plus, Minus, Edit, Trash, Eye, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Editor } from '@tinymce/tinymce-react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { ComplexSelector } from "@/components/events/ComplexSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { useDropzone } from 'react-dropzone';
import type {
  EventTab,
  AgeGroup,
  Complex,
  Field,
  FieldSize,
  EventInformationValues,
  ScoringRuleValues,
  EventData,
  ScoringRule,
  USA_TIMEZONES,
  TAB_ORDER,
  eventInformationSchema,
  scoringRuleSchema,
} from "@/components/forms/event-form-types";

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

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);
  const [selectedComplexes, setSelectedComplexes] = useState<Complex[]>([]);
  const [viewingComplexId, setViewingComplexId] = useState<number | null>(null);
  const [eventFieldSizes, setEventFieldSizes] = useState<Record<number, FieldSize>>({});
  const [selectedComplexIds, setSelectedComplexIds] = useState<number[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [isAgeGroupDialogOpen, setIsAgeGroupDialogOpen] = useState(false);
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [editingScoringRule, setEditingScoringRule] = useState<ScoringRule | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [selectedScopeId, setSelectedScopeId] = useState<number | null>(null);
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<number[]>([]);


  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch event');
      }
      const data = await response.json();

      // Initialize state with existing data
      if (data.complexes) {
        setSelectedComplexes(data.complexes);
        setSelectedComplexIds(data.complexes.map((c: Complex) => c.id));
      }
      if (data.fieldSizes) {
        setEventFieldSizes(data.fieldSizes);
      }
      if (data.ageGroups) {
        setAgeGroups(data.ageGroups);
      }
      if (data.scoringRules) {
        setScoringRules(data.scoringRules);
      }
      if (data.branding) {
        setPrimaryColor(data.branding.primaryColor || '#000000');
        setSecondaryColor(data.branding.secondaryColor || '#ffffff');
        if (data.branding.logoUrl) {
          setPreviewUrl(data.branding.logoUrl);
        }
      }

      return data;
    },
  });

  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    enabled: activeTab === 'complexes',
    queryFn: async () => {
      const response = await fetch('/api/admin/complexes');
      if (!response.ok) throw new Error('Failed to fetch complexes');
      return response.json() as Promise<Complex[]>;
    }
  });

  const fieldsQuery = useQuery({
    queryKey: ['/api/admin/fields', viewingComplexId],
    enabled: !!viewingComplexId,
    queryFn: async () => {
      if (!viewingComplexId) return [];
      const response = await fetch(`/api/admin/complexes/${viewingComplexId}/fields`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json() as Promise<Field[]>;
    }
  });

  const seasonalScopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    }
  });

  const form = useForm<EventInformationValues>({
    resolver: zodResolver(eventInformationSchema),
    defaultValues: {
      name: eventQuery.data?.name || "",
      startDate: eventQuery.data?.startDate || "",
      endDate: eventQuery.data?.endDate || "",
      timezone: eventQuery.data?.timezone || "",
      applicationDeadline: eventQuery.data?.applicationDeadline || "",
      details: eventQuery.data?.details || "",
      agreement: eventQuery.data?.agreement || "",
      refundPolicy: eventQuery.data?.refundPolicy || "",
    },
  });

  const ageGroupForm = useForm({
    resolver: zodResolver(eventInformationSchema),
    defaultValues: editingAgeGroup || {
      gender: 'Male',
      projectedTeams: 0,
      birthDateStart: '',
      birthDateEnd: '',
      scoringRule: '',
      ageGroup: '',
      fieldSize: '11v11' as FieldSize,
      amountDue: null,
    },
  });

  const scoringForm = useForm<ScoringRuleValues>({
    resolver: zodResolver(scoringRuleSchema),
    defaultValues: editingScoringRule || {
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

  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          complexes: selectedComplexes,
          fieldSizes: eventFieldSizes,
          ageGroups,
          scoringRules,
          branding: {
            logoUrl: previewUrl,
            primaryColor,
            secondaryColor,
          },
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
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
      }
      if (palette.LightVibrant) {
        setSecondaryColor(palette.LightVibrant.hex);
      }

      toast({
        title: "Colors extracted",
        description: "Brand colors have been updated based on your logo.",
      });
    } catch (error) {
      console.error('Color extraction error:', error);
      toast({
        title: "Error",
        description: "Failed to extract colors from the logo.",
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

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive space-y-4">
                <p>Failed to load event details</p>
                <Button onClick={() => navigate("/admin")}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderInformationTab = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => navigateTab('next'))} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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

          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Details</FormLabel>
                <FormControl>
                  <Editor
                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
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
                      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                    }}
                    onEditorChange={(content) => field.onChange(content)}
                    value={field.value}
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
                <FormLabel>Terms & Conditions</FormLabel>
                <FormControl>
                  <Editor
                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
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
                      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                    }}
                    onEditorChange={(content) => field.onChange(content)}
                    value={field.value}
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
                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
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
                      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                    }}
                    onEditorChange={(content) => field.onChange(content)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );

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
        <Button
          onClick={() => updateEventMutation.mutate(eventQuery.data)}
          disabled={updateEventMutation.isPending}
        >
          {updateEventMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
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

  const renderComplexTab = () => (
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
              ) || [];
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
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingComplexId(complex.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
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
                      <TableHead className="text-center">Event Field Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldsQuery.data.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">Edit Event</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <ProgressIndicator tabs={TAB_ORDER} completedTabs={completedTabs} />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventTab)}>
              <TabsList className="grid w-full grid-cols-6 mb-6">
                {TAB_ORDER.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="capitalize">
                    {tab.replace('-', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="information">
                {renderInformationTab()}
              </TabsContent>

              <TabsContent value="age-groups">
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
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]">Select</TableHead>
                                  <TableHead>Age Group</TableHead>
                                  <TableHead>Birth Years</TableHead>
                                  <TableHead>Gender</TableHead>
                                  <TableHead>Division</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {seasonalScopesQuery.data?.find(scope => scope.id === selectedScopeId)?.ageGroups.map((group) => (
                                  <TableRow key={group.id}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedAgeGroupIds.includes(group.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedAgeGroupIds(prev => [...prev, group.id]);
                                          } else {
                                            setSelectedAgeGroupIds(prev => prev.filter(id => id !== group.id));
                                          }
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
                    <Button variant="outline" onClick={() => navigateTab('next')}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button onClick={() => setIsScoringModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Scoring Rule
                          </Button>
                        </div>

                        {scoringRules.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead className="text-center">Win</TableHead>
                                <TableHead className="text-center">Loss</TableHead>
                                <TableHead className="text-center">Tie</TableHead>
                                <TableHead className="text-center">Goal Cap</TableHead>
                                <TableHead className="text-center">Shutout</TableHead>
                                <TableHead className="text-center">Red Card</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scoringRules.map((rule) => (
                                <TableRow key={rule.id}>
                                  <TableCell>{rule.title}</TableCell>
                                  <TableCell className="text-center">{rule.win}</TableCell>
                                  <TableCell className="text-center">{rule.loss}</TableCell>
                                  <TableCell className="text-center">{rule.tie}</TableCell>
                                  <TableCell className="text-center">{rule.goalCapped}</TableCell>
                                  <TableCell className="text-center">{rule.shutout}</TableCell>
                                  <TableCell className="text-center">{rule.redCard}</TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditScoringRule(rule)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteScoringRule(rule.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No scoring rules defined yet.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Dialog open={isScoringModalOpen} onOpenChange={setIsScoringModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingScoringRule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
                        </DialogTitle>
                      </DialogHeader>

                      <Form {...scoringForm}>
                        <form onSubmit={scoringForm.handleSubmit(handleScoringRuleSubmit)} className="space-y-4">
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

                          <div className="grid grid-cols-2 gap-4">
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
                          </div>

                          <FormField
                            control={scoringForm.control}
                            name="tieBreaker"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tie Breaker</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tie breaker" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="head_to_head">Head to Head</SelectItem>
                                    <SelectItem value="goal_difference">Goal Difference</SelectItem>
                                    <SelectItem value="goals_scored">Goals Scored</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <Button type="submit">{editingScoringRule ? 'Update' : 'Create'}</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>

              <TabsContent value="complexes">
                {renderComplexTab()}
              </TabsContent>

              <TabsContent value="settings">
                {renderSettingsTab()}
              </TabsContent>

              <TabsContent value="administrators">
                {/* Administrators tab content */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}