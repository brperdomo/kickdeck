import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { EventForm } from "@/components/forms/EventForm";
import { type EventTab } from "@/components/forms/event-form-types";
import { EventFormLayout } from "@/components/layouts/EventFormLayout";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";

export default function EditEvent() {
  // Basic hooks setup
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form and UI state
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);
  const form = useForm({ defaultValues: {} });
  
  // Query for event data
  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}/edit`);
      if (!response.ok) throw new Error('Failed to fetch event data');
      const data = await response.json();
      
      // Get seasonal scope ID from settings
      const seasonalScopeId = data.settings?.find(
        (s: any) => s.settingKey === 'seasonalScopeId'
      )?.settingValue;
      
      return {
        ...data,
        seasonalScopeId: seasonalScopeId ? parseInt(seasonalScopeId) : null
      };
    },
  });
  
  // Query for age groups
  const ageGroupsQuery = useQuery({
    queryKey: ['event-age-groups', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      const data = await response.json();
      return data;
    },
    enabled: !!id
  });
  
  // Mutation for updating the event
  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update event: ${errorData || response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['event-age-groups', id] });
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
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      const { mode, defaultValues, ...submitData } = formData;
      
      // Ensure seasonalScopeId is a number and valid
      const seasonalScopeId = submitData.seasonalScopeId 
        ? (typeof submitData.seasonalScopeId === 'string' 
            ? parseInt(submitData.seasonalScopeId) 
            : submitData.seasonalScopeId)
        : null;
      
      await updateEventMutation.mutateAsync({
        ...submitData,
        seasonalScopeId
      });
    } catch (error) {
      console.error("Submit error:", error);
    }
  };
  
  // Tab navigation
  const navigateTab = useCallback((direction: 'next' | 'prev') => {
    const steps = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];
    const currentIndex = steps.indexOf(activeTab);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < steps.length) {
      setActiveTab(steps[newIndex] as EventTab);
    }
  }, [activeTab]);
  
  // Update form values when data is loaded
  useEffect(() => {
    if (eventQuery.data && ageGroupsQuery.data) {
      const preparedData = {
        ...eventQuery.data,
        ageGroups: ageGroupsQuery.data || [],
        selectedComplexIds: eventQuery.data.selectedComplexIds || [],
        complexFieldSizes: eventQuery.data.complexFieldSizes || {},
        scoringRules: eventQuery.data.scoringRules || [],
        settings: eventQuery.data.settings || [],
        branding: eventQuery.data.branding || {
          logoUrl: "",
          primaryColor: "#000000",
          secondaryColor: "#ffffff"
        }
      };
      form.reset(preparedData);
    }
  }, [eventQuery.data, ageGroupsQuery.data, form]);
  
  // Loading state
  if (eventQuery.isLoading || ageGroupsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="bg-card border rounded-xl shadow-sm p-6 w-full max-w-md">
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (eventQuery.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="bg-card border rounded-xl shadow-sm p-6 w-full max-w-md">
            <div className="text-center text-destructive space-y-4">
              <p>Failed to load event details</p>
              <button 
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate("/admin")}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Prepare form data for rendering
  const formDataForRender = eventQuery.data ? {
    ...eventQuery.data,
    ageGroups: ageGroupsQuery.data || [],
    selectedComplexIds: eventQuery.data.selectedComplexIds || [],
    complexFieldSizes: eventQuery.data.complexFieldSizes || {},
    scoringRules: eventQuery.data.scoringRules || [],
    settings: eventQuery.data.settings || [],
    branding: eventQuery.data.branding || {
      logoUrl: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff"
    }
  } : {};
  
  // Render form
  return (
    <EventFormLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      completedTabs={completedTabs}
      isEdit={true}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <EventForm
            mode="edit"
            defaultValues={formDataForRender}
            form={form}
            isSubmitting={updateEventMutation.isPending}
            activeTab={activeTab}
            navigateTab={navigateTab}
          />
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => navigate("/admin/events")}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateEventMutation.isPending}>
              {updateEventMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </EventFormLayout>
  );
}