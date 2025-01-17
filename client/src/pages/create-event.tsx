import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, Edit, Trash, Eye } from "lucide-react";
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
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

// Helper function to generate unique IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';

const TAB_ORDER: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

// USA Timezones
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
  scoringRule: z.string(),
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
  ageGroups: string[];
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
  ageGroups: z.array(z.string()).min(1, "Select at least one age group"),
});

type ScoringRuleValues = z.infer<typeof scoringRuleSchema>;

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  openFields: number;
  closedFields: number;
  isOpen: boolean;
}

interface SelectedComplex extends Complex {
  selected: boolean;
}

const complexSelectionSchema = z.object({
  selectedComplexIds: z.array(z.string()).min(1, "Select at least one complex")
});

type ComplexSelectionValues = z.infer<typeof complexSelectionSchema>;

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

  const complexesQuery = useQuery({
    queryKey: ['/api/admin/complexes'],
    enabled: activeTab === 'complexes',
    queryFn: () => fetch('/api/admin/complexes').then(res => res.json()) as Promise<Complex[]>,
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
      scoringRule: 'default',
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
      ageGroups: [],
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
      ageGroups: rule.ageGroups,
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigateTab('prev')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Scoring Settings</h3>
                  </div>
                  <Dialog open={isScoringModalOpen} onOpenChange={setIsScoringModalOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        scoringForm.reset();
                        setIsScoringModalOpen(true);
                        setEditingScoringRule(null);
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingScoringRule ? 'Edit Scoring Rule' : 'Create New Scoring Rule'}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...scoringForm}>
                        <form onSubmit={scoringForm.handleSubmit(handleScoringRuleSubmit)} className="space-y-4">
                          <FormField
                            control={scoringForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rule Title</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter rule title" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={scoringForm.control}
                              name="win"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Win Points</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
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
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
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
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={scoringForm.control}
                              name="goalCapped"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Goal Cap</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
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
                                  <FormLabel>Shutout Bonus</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
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
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                  />
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
                                <FormLabel>Tie Breaker Rule</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tie breaker rule" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>                                    <SelectItem value="head_to_head">Head to Head</SelectItem>
                                    <SelectItem value="goal_difference">Goal Difference</SelectItem>
                                    <SelectItem value="goals_scored">Goals Scored</SelectItem>
                                    <SelectItem value="fair_play">Fair Play Points</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={scoringForm.control}
                            name="ageGroups"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age Groups</FormLabel>
                                <FormControl>
                                  <Select
                                    onValueChange={(value) => {
                                      const currentValues = field.value || [];
                                      const newValues = currentValues.includes(value)
                                        ? currentValues.filter(v => v !== value)
                                        : [...currentValues, value];
                                      field.onChange(newValues);
                                    }}
                                    value={field.value?.[0] || ""}
                                    multiple
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select age groups" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {ageGroups.map((group) => (
                                        <SelectItem key={group.id} value={group.id}>
                                          {group.ageGroup} - {group.gender}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsScoringModalOpen(false);
                                setEditingScoringRule(null);
                                scoringForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingScoringRule ? 'Update Rule' : 'Create Rule'}
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
                          <TableHead>Title</TableHead>
                          <TableHead className="text-center">Win</TableHead>
                          <TableHead className="text-center">Loss</TableHead>
                          <TableHead className="text-center">Tie</TableHead>
                          <TableHead className="text-center">Goal Cap</TableHead>
                          <TableHead className="text-center">Shutout</TableHead>
                          <TableHead className="text-center">Red Card</TableHead>
                          <TableHead>Tie Breaker</TableHead>
                          <TableHead>Age Groups</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scoringRules.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-4">
                              No scoring rules added yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          scoringRules.map((rule) => (
                            <TableRow key={rule.id}>
                              <TableCell>{rule.title}</TableCell>
                              <TableCell className="text-center">{rule.win}</TableCell>
                              <TableCell className="text-center">{rule.loss}</TableCell>
                              <TableCell className="text-center">{rule.tie}</TableCell>
                              <TableCell className="text-center">{rule.goalCapped}</TableCell>
                              <TableCell className="text-center">{rule.shutout}</TableCell>
                              <TableCell className="text-center">{rule.redCard}</TableCell>
                              <TableCell>
                                {rule.tieBreaker.split('_').map(word =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </TableCell>
                              <TableCell>
                                {ageGroups
                                  .filter(group => rule.ageGroups.includes(group.id))
                                  .map(group => group.ageGroup)
                                  .join(', ')}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditScoringRule(rule)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => setScoringRules(rules =>
                                      rules.filter(r => r.id !== rule.id)
                                    )}
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

            <TabsContent value="complexes">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <h3 className="text-lg font-semibold">Select Complexes</h3>
                </div>

                <div className="space-y-4">
                  <Form {...complexSelectionForm}>
                    <form onSubmit={complexSelectionForm.handleSubmit(onComplexSelectionSubmit)} className="space-y-4">
                      <FormField
                        control={complexSelectionForm.control}
                        name="selectedComplexIds"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel>Select Complexes for this Event</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {complexesQuery.data?.map((complex) => (
                                  <div key={complex.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value.includes(complex.id.toString())}
                                      onCheckedChange={(checked) => {
                                        const value = complex.id.toString();
                                        const newValue = checked
                                          ? [...field.value, value]
                                          : field.value.filter((v) => v !== value);
                                        field.onChange(newValue);

                                        // Update selected complexes
                                        const selectedIds = newValue.map(v => parseInt(v));
                                        const updatedComplexes = complexesQuery.data
                                          ?.filter(complex => selectedIds.includes(complex.id))
                                          .map(complex => ({
                                            ...complex,
                                            selected: true
                                          })) || [];
                                        setSelectedComplexes(updatedComplexes);
                                      }}
                                    />
                                    <Label>
                                      {complex.name} ({complex.openFields + complex.closedFields} fields)
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>

                  {selectedComplexes.length > 0 && (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Complex Name</TableHead>
                              <TableHead className="text-center"># of Fields</TableHead>
                              <TableHead>Address</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedComplexes.map((complex) => (
                              <TableRow key={complex.id}>
                                <TableCell className="font-medium">
                                  {complex.name}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">
                                    {complex.openFields + complex.closedFields} Fields
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {complex.address}, {complex.city}, {complex.state}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={complex.isOpen ? "success" : "destructive"}>
                                    {complex.isOpen ? "Open" : "Closed"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant={complex.isOpen ? "destructive" : "default"}
                                      size="sm"
                                      onClick={() => {
                                        fetch(`/api/admin/complexes/${complex.id}/status`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({ isOpen: !complex.isOpen }),
                                        }).then(() => {
                                          complexesQuery.refetch();
                                        });
                                      }}
                                    >
                                      {complex.isOpen ? 'Close Complex' : 'Open Complex'}
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Fields
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={() => navigateTab('next')}>Save & Continue</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <h3 className="text-lg font-semibold">Event Settings</h3>
                </div>
                {/* Event settings form will be implemented here */}
                <div className="flex justify-end mt-4">
                  <Button onClick={() => navigateTab('next')}>Save & Continue</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="administrators">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigateTab('prev')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <h3 className="text-lg font-semibold">Event Administrators</h3>
                </div>
                {/* Administrators management will be implemented here */}
                <div className="flex justify-end mt-4">
                  <Button onClick={() => navigate("/admin")}>Finish</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}