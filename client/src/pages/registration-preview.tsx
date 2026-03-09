import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EventRegistration from "./event-registration";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";

// Special banner component for the preview mode
function PreviewModeBanner() {
  return (
    <Alert className="bg-amber-500/10 border-amber-500/30 mb-4">
      <AlertCircle className="h-4 w-4 text-amber-400" />
      <AlertTitle className="text-amber-300">Preview Mode</AlertTitle>
      <AlertDescription className="text-amber-400">
        You are viewing the registration process in preview mode. No actual registrations or payments will be processed.
      </AlertDescription>
    </Alert>
  );
}

export default function RegistrationPreview() {
  const { id: eventId } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load event details for preview",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, toast]);

  if (loading) {
    return (
      <AdminPageWrapper title="Registration Preview" backUrl="/admin" backLabel="Back to Dashboard">
        <Card>
          <CardHeader>
            <CardTitle>Loading Preview...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </AdminPageWrapper>
    );
  }

  if (!event) {
    return (
      <AdminPageWrapper title="Registration Preview" backUrl="/admin" backLabel="Back to Dashboard">
        <Card>
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">
              The event you are trying to preview could not be found. Please check the event ID and try again.
            </p>
            <Button
              className="mt-4"
              onClick={() => window.history.back()}
            >
              Return to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Registration Preview"
      backUrl={`/admin/events/${eventId}`}
      backLabel="Back to Event"
    >
      <PreviewModeBanner />

      {/* Custom wrapper around the actual registration component */}
      <div className="registration-preview-wrapper">
        <EventRegistration isPreview={true} eventIdOverride="preview" />
      </div>
    </AdminPageWrapper>
  );
}
