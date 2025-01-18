import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, Edit, Trash, Eye, ArrowRight } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

// Reuse types and schemas from create-event.tsx
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
}

export type EventTab = 'information' | 'age-groups' | 'scoring' | 'complexes' | 'settings' | 'administrators';

export const TAB_ORDER: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

// USA Timezones from create-event.tsx
const USA_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

export const eventInformationSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Time zone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
});

export type EventInformationValues = z.infer<typeof eventInformationSchema>;

interface EventFormProps {
  initialData?: EventData;
  onSubmit: (data: EventData) => void;
  isEdit?: boolean;
}

export function EventForm({ initialData, onSubmit, isEdit = false }: EventFormProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const { toast } = useToast();

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

  const handleSubmit = (data: EventInformationValues) => {
    // TODO: Add validation and combine with age groups and complex data
    onSubmit(data as EventData);
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

            <TabsContent value="information">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-4xl mx-auto">
                  {/* Form fields from create-event.tsx */}
                  {/* ... */}
                </form>
              </Form>
            </TabsContent>

            {/* Other tab contents */}
            {/* ... */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
