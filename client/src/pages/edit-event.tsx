import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { EventForm, type EventData } from "@/components/forms/EventForm";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function EditEvent() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Query for event details
  const eventQuery = useQuery({
    queryKey: [`/api/admin/events/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${id}`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
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
        throw new Error(error);
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive font-medium">Failed to load event details</p>
        <button
          onClick={() => navigate("/admin")}
          className="text-primary hover:underline"
        >
          Return to Dashboard
        </button>
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