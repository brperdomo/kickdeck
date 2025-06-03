import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/components/forms/EventForm";
import { type EventTab } from "@/components/forms/event-form-types";
import { EventFormLayout } from "@/components/layouts/EventFormLayout";

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EventTab>('information');
  const [completedTabs, setCompletedTabs] = useState<EventTab[]>([]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    await createEventMutation.mutateAsync(data);
  };

  const tabs: EventTab[] = ['information', 'age-groups', 'scoring', 'complexes', 'settings', 'administrators'];

  return (
    <EventFormLayout 
      title="Create Event" 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      tabs={tabs}
    >
      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="p-6">
          <EventForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={createEventMutation.isPending}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            completedTabs={completedTabs}
            onCompletedTabsChange={setCompletedTabs}
            navigateTab={(direction) => {
              const currentIndex = tabs.indexOf(activeTab);
              const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
              if (newIndex >= 0 && newIndex < tabs.length) {
                setActiveTab(tabs[newIndex] as EventTab);
              }
            }}
          />
        </CardContent>
      </Card>
    </EventFormLayout>
  );
}