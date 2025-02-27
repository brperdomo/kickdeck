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

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}/edit`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch event');
      }
      return response.json();
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
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
        return response.json();
      } catch (error) {
        console.error('Error updating event:', error);
        throw error;
      }
    },
    onSuccess: () => {
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
      // Ensure age groups are properly formatted
      const sanitizedFormData = {
        ...formData,
        ageGroups: formData.ageGroups?.map(group => ({
          ...group,
          projectedTeams: group.projectedTeams || 0,
          amountDue: group.amountDue || null
        })) || []
      };

      await updateEventMutation.mutateAsync(sanitizedFormData);
      toast({
        title: "Event Updated",
        description: "Event has been updated successfully",
      });
      navigate('/admin/events');
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const eventData = {
    ...eventQuery.data,
    complexFieldSizes: eventQuery.data.complexFieldSizes || {},
    ageGroups: eventQuery.data.ageGroups || [],
    scoringRules: eventQuery.data.scoringRules || [],
    selectedComplexIds: eventQuery.data.selectedComplexIds || [],
    branding: eventQuery.data.branding || {
      logoUrl: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff"
    }
  };

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
              defaultValues={eventData}
              onSubmit={handleSubmit}
              isSubmitting={updateEventMutation.isPending}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              completedTabs={completedTabs}
              onCompletedTabsChange={setCompletedTabs}
              navigateTab={navigateTab}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}