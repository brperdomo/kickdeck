import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  ArrowLeft 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EventRegistration from "./event-registration";

// Special banner component for the preview mode
function PreviewModeBanner() {
  return (
    <Alert className="bg-amber-50 border-amber-300 mb-4">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700">Preview Mode</AlertTitle>
      <AlertDescription className="text-amber-600">
        You are viewing the registration process in preview mode. No actual registrations or payments will be processed.
      </AlertDescription>
    </Alert>
  );
}

// Return to admin button component
function ReturnToAdminButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="mb-4"
      onClick={() => window.history.back()}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Return to Admin Dashboard
    </Button>
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
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Preview...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <ReturnToAdminButton />
      <PreviewModeBanner />
      
      {/* Custom wrapper around the actual registration component */}
      <div className="registration-preview-wrapper">
        {/* Pass isPreview prop to the component and also the eventId */}
        <EventRegistration isPreview={true} eventIdOverride="preview" />
      </div>
    </div>
  );
}