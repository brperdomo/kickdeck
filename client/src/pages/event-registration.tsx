import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";
import { useAuth } from "@/hooks/use-auth";

interface AgeGroup {
  id: number;
  ageGroup: string;
  gender: string;
  divisionCode: string | null;
  birthYear: number | null;
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  details: string;
  ageGroups: AgeGroup[];
}

type RegistrationStep = 'auth' | 'personal' | 'team' | 'review' | 'complete';

export default function EventRegistration() {
  const { eventId } = useParams();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('auth');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log('Fetching event details for ID:', eventId);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        console.log('Received event data:', data);
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
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

  // Effect to handle step transitions based on auth state
  useEffect(() => {
    if (!authLoading && user) {
      setCurrentStep('personal');
    }
  }, [authLoading, user]);

  const renderStepIndicator = () => {
    const steps: { key: RegistrationStep; label: string }[] = [
      { key: 'auth', label: 'Sign In' },
      { key: 'personal', label: 'Personal Details' },
      { key: 'team', label: 'Team Information' },
      { key: 'review', label: 'Review & Confirm' }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center ${currentStep === step.key ? 'text-[#2C5282]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 
                ${currentStep === step.key ? 'bg-[#2C5282] text-white' : 
                  index < steps.findIndex(s => s.key === currentStep) ? 'bg-[#48BB78] text-white' : 'bg-gray-200'}`}>
                {index < steps.findIndex(s => s.key === currentStep) ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-sm">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-24 h-[2px] mx-2 
                ${index < steps.findIndex(s => s.key === currentStep) ? 'bg-[#48BB78]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAgeGroups = (ageGroups: AgeGroup[]) => {
    const groupedByGender = ageGroups.reduce((acc, group) => {
      if (!acc[group.gender]) {
        acc[group.gender] = [];
      }
      const displayText = group.divisionCode || `${group.gender} ${group.ageGroup}`;
      acc[group.gender].push({
        ...group,
        displayText
      });
      return acc;
    }, {} as Record<string, (AgeGroup & { displayText: string })[]>);

    return (
      <div className="space-y-4">
        {Object.entries(groupedByGender).map(([gender, groups]) => (
          <div key={gender} className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">{gender}:</h4>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <span 
                  key={group.id} 
                  className="bg-white px-3 py-1 rounded-full text-sm text-blue-600 border border-blue-100"
                >
                  {group.displayText}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleAuthRedirect = () => {
    // Store the current URL in session storage
    sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
    setLocation('/auth');
  };

  if (loading || authLoading) {
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

  const isDeadlinePassed = new Date(event.applicationDeadline) < new Date();
  if (isDeadlinePassed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-amber-600">Registration Closed</h2>
            <p className="mt-2 text-gray-600">
              The registration deadline for this event ({new Date(event.applicationDeadline).toLocaleDateString()}) has passed. 
              Registration is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <SoccerFieldBackground className="opacity-50" />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {renderStepIndicator()}

        <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-3xl font-bold text-[#2C5282]">{event.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {currentStep === 'auth' && !user && (
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Sign In Required</h3>
                <p className="text-gray-600 mb-6">
                  Please sign in or create an account to register for this event.
                </p>
                <Button 
                  size="lg"
                  className="bg-[#2C5282] hover:bg-[#1A365D] text-white font-semibold px-8"
                  onClick={handleAuthRedirect}
                >
                  Sign In / Register
                </Button>
              </div>
            )}

            {(currentStep !== 'auth' || user) && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Event Dates</h3>
                    <p>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Registration Deadline</h3>
                    <p>{new Date(event.applicationDeadline).toLocaleDateString()}</p>
                  </div>
                </div>

                {event.ageGroups && event.ageGroups.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Eligible Age Groups</h3>
                    {renderAgeGroups(event.ageGroups)}
                  </div>
                )}

                {event.details && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#2C5282]">Event Details</h3>
                    <div 
                      className="prose max-w-none prose-blue prose-headings:text-[#2C5282] prose-p:text-gray-700" 
                      dangerouslySetInnerHTML={{ __html: event.details }} 
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}