
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventApplicationPage() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = params.id;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error("Error fetching event details:", err);
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, toast]);

  const handleApply = () => {
    // This is a placeholder for the actual application logic
    toast({
      title: "Coming Soon",
      description: "Application functionality will be available soon.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600">Event Not Found</h2>
            <p className="mt-2 text-gray-600">This event may have been removed or is no longer available.</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/events")}
            >
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-md overflow-hidden border-0">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-2xl">Apply for {event.name}</CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Application Process</h3>
              <p className="text-gray-600">
                Complete the form below to register for this event. You will receive a confirmation
                email once your application has been processed.
              </p>
            </div>
            
            <div className="py-12 text-center">
              <p className="text-lg font-medium mb-4">Application Form Coming Soon</p>
              <p className="text-gray-600 mb-6">
                We're currently finalizing the application process for this event.
                Please check back soon or contact the event administrator for more information.
              </p>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate(`/events/${event.id}`)}>
                  Back to Event Details
                </Button>
                <Button onClick={handleApply}>
                  Register Interest
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
