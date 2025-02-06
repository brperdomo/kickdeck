import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";

interface Event {
  id: string; // Updated ID type to string
  name: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  details: string;
}

export default function EventRegistration() {
  const { eventId } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load event details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <SoccerFieldBackground className="opacity-50" />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-3xl font-bold text-[#333333]">{event.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-[#1E88E5]">Event Dates</h3>
                <p>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-[#1E88E5]">Registration Deadline</h3>
                <p>{new Date(event.applicationDeadline).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-[#1E88E5]">Event Details</h3>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.details }} />
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                size="lg"
                className="bg-[#43A047] hover:bg-[#2E7D32] text-white font-semibold px-8"
                onClick={() => {
                  // TODO: Implement registration flow
                  toast({
                    title: "Coming Soon",
                    description: "Registration functionality will be available soon.",
                  });
                }}
              >
                Register Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}