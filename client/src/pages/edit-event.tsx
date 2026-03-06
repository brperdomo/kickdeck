import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/forms/EventForm";
import { type EventTab } from "@/components/forms/event-form-types";
import { EventEditLayout } from "@/components/layouts/EventEditLayout";

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);
  const submitRef = useRef<(() => void) | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ['ageGroupEligibilitySettings', id] });
      toast({
        title: "Success",
        description: "Event updated successfully. You can continue editing.",
      });
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

  // Trigger save via the submitRef exposed by EventForm
  const handleSave = () => {
    if (submitRef.current) {
      submitRef.current();
    }
  };

  if (eventQuery.isLoading || ageGroupsQuery.isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0f0f1a" }}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <span className="text-gray-400 text-lg">Loading event...</span>
        </div>
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0f0f1a" }}
      >
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">Failed to load event details</p>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-300 hover:text-white hover:bg-violet-500/10"
            onClick={() => navigate("/admin")}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Prepare the event data for the form
  const eventData = {
    ...eventQuery.data,
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
    branding: {
      logoUrl: eventQuery.data.branding?.logoUrl ||
               eventQuery.data.settings?.find((s: any) => s.key === 'branding.logoUrl')?.value ||
               "",
      primaryColor: eventQuery.data.branding?.primaryColor ||
                    eventQuery.data.settings?.find((s: any) => s.key === 'branding.primaryColor')?.value ||
                    "#007AFF",
      secondaryColor: eventQuery.data.branding?.secondaryColor ||
                     eventQuery.data.settings?.find((s: any) => s.key === 'branding.secondaryColor')?.value ||
                     "#34C759"
    }
  };

  const tabs: EventTab[] = ['information', 'age-groups', 'flights', 'scoring', 'complexes', 'settings', 'banking', 'administrators'];

  const eventTitle = eventQuery.data?.name
    ? `Edit: ${eventQuery.data.name}`
    : "Edit Event";

  return (
    <EventEditLayout
      title={eventTitle}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
      onSave={handleSave}
      isSaving={updateEventMutation.isPending}
    >
      <EventForm
        mode="edit"
        layout="edit"
        defaultValues={eventData}
        onSubmit={handleSubmit}
        isSubmitting={updateEventMutation.isPending}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        completedTabs={completedTabs}
        onCompletedTabsChange={setCompletedTabs}
        submitRef={submitRef}
        navigateTab={(direction) => {
          const currentIndex = tabs.indexOf(activeTab);
          const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
          if (newIndex >= 0 && newIndex < tabs.length) {
            setActiveTab(tabs[newIndex] as EventTab);
          }
        }}
      />
    </EventEditLayout>
  );
}
