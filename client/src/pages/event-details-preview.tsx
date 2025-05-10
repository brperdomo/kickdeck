import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
// Remove SoccerFieldBackground since it doesn't exist
// We'll use a simple div instead
import { Footer } from "@/components/ui/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

/**
 * This is a separate component from EventRegistration that only shows
 * the event details without requiring authentication. Once the user
 * clicks "Register", they'll be redirected to login if needed.
 */
export default function EventDetailsPreview() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  // Get the event ID from URL params
  const eventId = params.eventId;
  
  // Event data state
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) {
        setError("No event ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch event: ${res.status}`);
        }
        
        const data = await res.json();
        setEvent(data);
        
        // Store in session storage for use in the full registration process
        sessionStorage.setItem('previewedEvent', JSON.stringify(data));
        sessionStorage.setItem('previewedEventId', eventId);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvent();
  }, [eventId]);
  
  // Handle registration button click
  const handleRegisterClick = () => {
    // Set flags to indicate we're in a registration flow
    sessionStorage.setItem('inRegistrationFlow', 'true');
    
    // Create a registration data object
    const registrationData = {
      preventRedirect: true,
      inRegistrationFlow: true,
      eventId: eventId,
      timestamp: Date.now()
    };
    
    // Store this data
    sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
    
    // If user is already logged in, go directly to registration
    if (user) {
      window.location.href = `/register/event/${eventId}`;
    } else {
      // Otherwise, redirect to auth with return path
      const redirectPath = `/register/event/${eventId}`;
      sessionStorage.setItem('redirectAfterAuth', redirectPath);
      window.location.href = '/auth';
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading event details...</span>
      </div>
    );
  }
  
  // Render error state
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">
          {error || "Failed to load event details"}
        </div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }
  
  // Helper function to render age groups
  const renderAgeGroups = (ageGroups: any[]) => {
    const groupedByGender: Record<string, any[]> = {};
    
    // Group by gender
    ageGroups.forEach(group => {
      if (!groupedByGender[group.gender]) {
        groupedByGender[group.gender] = [];
      }
      groupedByGender[group.gender].push(group);
    });
    
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(groupedByGender).map(([gender, groups]) => (
          <div key={gender} className="space-y-2">
            <h4 className="font-medium">{gender === 'boys' ? 'Boys' : 'Girls'}</h4>
            <div className="grid grid-cols-2 gap-2">
              {groups.map(group => (
                <div 
                  key={group.id} 
                  className="border rounded p-2 text-center"
                  style={{ 
                    borderColor: event?.branding?.primaryColor || '#2C5282',
                    color: event?.branding?.primaryColor || '#2C5282'
                  }}
                >
                  {group.ageGroup}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render event details
  return (
    <div className="flex flex-col min-h-screen">
      {/* Background */}
      {event.branding?.logoUrl ? (
        <img 
          src={event.branding.logoUrl} 
          alt={`${event.name} background`}
          className="fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        />
      ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50 z-0"></div>
      )}
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur">
          <CardHeader className="text-center border-b">
            {event.branding?.logoUrl && (
              <div className="mx-auto mb-4">
                <img 
                  src={event.branding.logoUrl} 
                  alt={`${event.name} logo`} 
                  className="max-h-32 object-contain mx-auto"
                />
              </div>
            )}
            <CardTitle 
              className="text-3xl font-bold" 
              style={{ 
                color: event?.branding?.primaryColor || '#2C5282',
                textShadow: event?.branding?.primaryColor ? `0 1px 2px rgba(0,0,0,0.1)` : 'none'
              }}
            >
              {event.name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 
                  className="font-semibold"
                  style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                >Event Dates</h3>
                <p>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <h3 
                  className="font-semibold"
                  style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                >Registration Deadline</h3>
                <p>{new Date(event.applicationDeadline).toLocaleDateString()}</p>
              </div>
            </div>

            {event.ageGroups && event.ageGroups.length > 0 && (
              <div className="space-y-2">
                <h3 
                  className="font-semibold"
                  style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                >Eligible Age Groups</h3>
                {renderAgeGroups(event.ageGroups)}
              </div>
            )}

            {event.details && (
              <div className="space-y-2">
                <h3 
                  className="font-semibold"
                  style={{ color: event?.branding?.primaryColor || '#2C5282' }}
                >Event Details</h3>
                <div 
                  className="prose max-w-none prose-blue prose-p:text-gray-700" 
                  style={{ 
                    '--tw-prose-headings': event?.branding?.primaryColor || '#2C5282' 
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: event.details }} 
                />
              </div>
            )}
            
            <div className="pt-6 text-center">
              <Button
                onClick={handleRegisterClick}
                className="px-6 py-3 text-white text-lg font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: event?.branding?.primaryColor || '#2C5282',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                }}
              >
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : user ? (
                  'Proceed to Registration'
                ) : (
                  'Login to Register'
                )}
              </Button>
              
              <p className="mt-2 text-sm text-gray-500">
                {user ? 
                  `Logged in as ${user.email}` : 
                  'You will need to log in or create an account to register for this event.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}