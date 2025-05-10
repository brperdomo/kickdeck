import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function EmergencyRegistrationFix() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [eventId, setEventId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Get the event ID from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const id = params.get('eventId');
    if (id) {
      setEventId(id);
    }
  }, []);

  const handleFixRegistration = () => {
    if (!eventId) {
      alert("No event ID found in URL. Please go back and try again.");
      return;
    }

    if (!user) {
      alert("You must be logged in to continue. Please log in first.");
      return;
    }

    // Store the key state in sessionStorage to skip auth step when redirected
    sessionStorage.setItem('bypassAuthStep', 'true');
    sessionStorage.setItem('bypassAuthEventId', eventId);
    sessionStorage.setItem('bypassAuthTimestamp', Date.now().toString());
    
    // Set success state before redirecting
    setIsSuccess(true);
    
    // Redirect after a brief delay to show success message
    setTimeout(() => {
      navigate(`/register/event/${eventId}`);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-amber-50 border-b border-amber-100">
          <CardTitle className="text-amber-800 text-xl">Registration Fix Tool</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="inline-flex mx-auto items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-500">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">Success!</h3>
              <p className="text-gray-600">
                Registration fix applied. Redirecting you to the registration page...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-amber-800 text-sm">
                    This tool will help you get past step 1 in the registration process if you're stuck in a login loop.
                  </p>
                </div>

                <div className="space-y-2">
                  <p><strong>Status:</strong></p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li className={user ? "text-green-600" : "text-red-600"}>
                      {user ? "✓ Logged in as " + user.email : "✗ Not logged in"}
                    </li>
                    <li className={eventId ? "text-green-600" : "text-red-600"}>
                      {eventId ? "✓ Event ID detected: " + eventId : "✗ No event ID detected"}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                {!user && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate("/auth")}
                  >
                    Login First
                  </Button>
                )}

                <Button
                  className="w-full"
                  disabled={!user || !eventId}
                  onClick={handleFixRegistration}
                >
                  {!user ? "Login Required" : !eventId ? "No Event ID Found" : "Apply Registration Fix"}
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(eventId ? `/register/event/${eventId}` : "/")}
                >
                  Return to Registration
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}