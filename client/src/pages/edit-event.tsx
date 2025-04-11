import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/components/forms/EventForm";
import { type EventTab } from "@/components/forms/event-form-types";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);

  // Query for event data including settings
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

  // Query for event's age groups
  const ageGroupsQuery = useQuery({
    queryKey: ['event-age-groups', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      const data = await response.json();
      console.log('Fetched age groups:', data);
      return data;
    },
    enabled: !!id
  });

  // Mutation for updating event
  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Submitting event update with data:', data);
      try {
        const response = await fetch(`/api/admin/events/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Server response:', errorData);
          throw new Error(`Failed to update event: ${errorData || response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error updating event:', error);
        throw error;
      }
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

  const handleSubmit = async (formData: any) => {
    try {
      console.log('Form data received:', formData);
      const { mode, defaultValues, ...submitData } = formData;
      
      // Ensure seasonalScopeId is a number and valid
      const seasonalScopeId = submitData.seasonalScopeId 
        ? (typeof submitData.seasonalScopeId === 'string' 
            ? parseInt(submitData.seasonalScopeId) 
            : submitData.seasonalScopeId)
        : (eventQuery.data?.seasonalScopeId 
            ? (typeof eventQuery.data.seasonalScopeId === 'string'
                ? parseInt(eventQuery.data.seasonalScopeId)
                : eventQuery.data.seasonalScopeId)
            : null);
            
      console.log('Using seasonalScopeId:', seasonalScopeId);
            
      await updateEventMutation.mutateAsync({
        ...submitData,
        seasonalScopeId
      });
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  if (eventQuery.isLoading || ageGroupsQuery.isLoading) {
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

  // Prepare the event data for the form
  const eventData = {
    ...eventQuery.data,
    // Ensure seasonalScopeId is explicitly set and converted to number
    seasonalScopeId: eventQuery.data.seasonalScopeId 
      ? (typeof eventQuery.data.seasonalScopeId === 'string' 
          ? parseInt(eventQuery.data.seasonalScopeId) 
          : eventQuery.data.seasonalScopeId)
      : null,
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

  console.log('Prepared event data:', eventData);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Edit Event</h1>
            </div>

            <ProgressIndicator
              steps={['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators']}
              currentStep={activeTab}
              completedSteps={completedTabs}
            />

            <EventForm
              mode="edit"
              defaultValues={eventData}
              onSubmit={handleSubmit}
              isSubmitting={updateEventMutation.isPending}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              completedTabs={completedTabs}
              onCompletedTabsChange={setCompletedTabs}
              navigateTab={(direction) => {
                const steps = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];
                const currentIndex = steps.indexOf(activeTab);
                const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
                if (newIndex >= 0 && newIndex < steps.length) {
                  setActiveTab(steps[newIndex] as EventTab);
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}