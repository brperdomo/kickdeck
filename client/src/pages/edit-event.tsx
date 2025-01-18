import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { EventForm } from "@/components/forms/EventForm";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { EventData } from "@/lib/types/event";

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Query for event details including all sections
  const eventQuery = useQuery({
    queryKey: [`/api/admin/events/${id}/edit`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}/edit`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch event details');
      }
      return response.json() as Promise<EventData>;
    },
  });

  // Mutation for updating event
  const updateEventMutation = useMutation({
    mutationFn: async (data: EventData) => {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update event');
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
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive"
      });
    }
  });

  if (eventQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">
          {eventQuery.error instanceof Error ? eventQuery.error.message : "Error loading event details"}
        </p>
      </div>
    );
  }

  return (
    <EventForm
      initialData={eventQuery.data}
      onSubmit={(data) => updateEventMutation.mutate(data)}
      isEdit={true}
    />
  );
}