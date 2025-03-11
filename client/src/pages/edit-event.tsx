import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm, type EventFormData } from "@/components/forms/EventForm";
import { type EventTab, TAB_ORDER } from "@/components/forms/event-form-types";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);
  const [selectedSeasonalScopeId, setSelectedSeasonalScopeId] = useState<number | null>(null); // Added state for selectedSeasonalScopeId
  const [availableAgeGroups, setAvailableAgeGroups] = useState<any[]>([]); //Added state for available age groups.  Type needs to be defined properly.

  const {data: seasonalScopes, isLoading: seasonalScopesLoading} = useQuery({ // Added query for seasonal scopes.
    queryKey: ['seasonalScopes'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/seasonal-scopes`); //Endpoint needs to be adjusted to match your backend.
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    },
  });


  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}/edit`);
      if (!response.ok) throw new Error('Failed to fetch event data');
      const data = await response.json();

      // Set the seasonal scope ID when event data is loaded
      if (data && data.seasonalScopeId) {
        setSelectedSeasonalScopeId(Number(data.seasonalScopeId));
        console.log('Loaded seasonal scope ID from event:', data.seasonalScopeId);

        // If we have seasonal scopes data, load age groups automatically for this scope
        if (seasonalScopes && seasonalScopes.length > 0) {
          const selectedScope = seasonalScopes.find(scope => scope.id === data.seasonalScopeId);
          if (selectedScope && selectedScope.ageGroups) {
            setAvailableAgeGroups(selectedScope.ageGroups);
            console.log('Automatically loaded age groups for scope:', selectedScope.ageGroups);
          }
        }
      }

      return data;
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
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

        const responseData = await response.json();
        console.log('Server response after update:', responseData);
        return responseData;
      } catch (error) {
        console.error('Error updating event:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Update successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast({
        title: "Success",
        description: "Event updated successfully",
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

  const handleSubmit = async (formData: EventFormData) => {
    try {
      // Remove any properties that should not be sent to the API
      const { onSubmit, defaultValues, mode, ...sanitizedFormData } = formData;

      // Make sure seasonalScopeId is included in the form data
      if (selectedSeasonalScopeId) {
        sanitizedFormData.seasonalScopeId = selectedSeasonalScopeId;
      }

      console.log(`Submitting form data with ${sanitizedFormData.ageGroups?.length || 0} selected age groups`);
      await updateEventMutation.mutateAsync(sanitizedFormData);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (eventQuery.isLoading || seasonalScopesLoading) { //Added seasonalScopesLoading to loading condition
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

  const eventData = {
    ...eventQuery.data,
    complexFieldSizes: eventQuery.data.complexFieldSizes || {},
    ageGroups: eventQuery.data.ageGroups?.map(group => ({
      ...group,
      selected: true, // Mark existing age groups as selected
      feeId: group.feeId // Ensure feeId is included from the server response
    })) || [],
    scoringRules: eventQuery.data.scoringRules || [],
    selectedComplexIds: eventQuery.data.selectedComplexIds || [],
    branding: eventQuery.data.branding || {
      logoUrl: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff"
    }
  };

  // Prepare form data
  const prepareFormData = (eventData) => {
    console.log('Prepared event data for form:', eventData);

    // Initialize the selectedSeasonalScopeId from eventData
    if (eventData.seasonalScopeId) {
      setSelectedSeasonalScopeId(eventData.seasonalScopeId);
    }

    return {
      id: eventData.id,
      name: eventData.name,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      timezone: eventData.timezone,
      location: eventData.location,
      address: eventData.address,
      city: eventData.city,
      state: eventData.state,
      zipCode: eventData.zipCode,
      country: eventData.country,
      description: eventData.description,
      isPublic: eventData.isPublic,
      registrationOpen: eventData.registrationOpen,
      registrationClose: eventData.registrationClose,
      maxTeams: eventData.maxTeams,
      logoUrl: eventData.logoUrl,
      seasonalScopeId: eventData.seasonalScopeId,
      ageGroups: eventData.ageGroups || [],
      venue: eventData.venue || { fields: [] },
      scoring: eventData.scoring || {},
      schedule: eventData.schedule || { days: [] },
      customFields: eventData.customFields || [],
    };
  };

  console.log('Prepared event data for form:', prepareFormData(eventData));

  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < TAB_ORDER.length) {
      setActiveTab(TAB_ORDER[newIndex]);
    }
  };

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
              steps={TAB_ORDER}
              currentStep={activeTab}
              completedSteps={completedTabs}
            />

            <EventForm 
              mode="edit"
              defaultValues={prepareFormData(eventData)} // Use prepared data
              onSubmit={handleSubmit}
              isSubmitting={updateEventMutation.isPending}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              completedTabs={completedTabs}
              onCompletedTabsChange={setCompletedTabs}
              navigateTab={navigateTab}
              selectedSeasonalScopeId={selectedSeasonalScopeId} // Pass the state to EventForm
              availableAgeGroups={availableAgeGroups} // Pass availableAgeGroups to EventForm
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}