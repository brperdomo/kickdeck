import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, Users, ChevronRight } from "lucide-react";
import { Footer } from "@/components/ui/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

/** Convert hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Event registration landing page — dark glassmorphism design
 * driven by the event's branding colors and logo.
 */
export default function EventDetailsPreview() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const eventId = params.eventId;

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
        sessionStorage.setItem("previewedEvent", JSON.stringify(data));
        sessionStorage.setItem("previewedEventId", eventId);
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
    console.log(
      "AUTH FIX: User clicked register button",
      user ? "User is logged in" : "User not logged in"
    );

    sessionStorage.setItem("inRegistrationFlow", "true");
    sessionStorage.setItem("registrationEventId", eventId!);
    sessionStorage.setItem("registrationTimestamp", Date.now().toString());
    sessionStorage.setItem("allowUnauthenticatedAccess", "true");

    const registrationData = {
      preventRedirect: true,
      inRegistrationFlow: true,
      eventId: eventId,
      timestamp: Date.now(),
      allowUnauthenticatedAccess: true,
    };
    sessionStorage.setItem("registrationData", JSON.stringify(registrationData));

    window.location.href = `/register/event/${eventId}/form`;
  };

  // Branding colors with defaults
  const primaryColor = event?.branding?.primaryColor || "#007AFF";
  const secondaryColor = event?.branding?.secondaryColor || "#34C759";
  const logoUrl = event?.branding?.logoUrl || null;

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ backgroundColor: "#0f0f1a" }}
      >
        <Loader2
          className="h-10 w-10 animate-spin mb-4"
          style={{ color: primaryColor }}
        />
        <span className="text-gray-400 text-sm">Loading event details...</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ backgroundColor: "#0f0f1a" }}
      >
        <div className="text-red-400 text-lg font-medium">
          {error || "Failed to load event details"}
        </div>
        <Button
          variant="outline"
          className="border-gray-600 text-gray-300 hover:text-white hover:bg-white/10"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // ── Age groups helper ──────────────────────────────────────────
  const renderAgeGroups = (ageGroups: any[]) => {
    const groupedByGender: Record<string, any[]> = {};

    ageGroups.forEach((group) => {
      if (!groupedByGender[group.gender]) {
        groupedByGender[group.gender] = [];
      }
      groupedByGender[group.gender].push(group);
    });

    // Sort each gender group by age (U8, U9, U10, ...)
    Object.keys(groupedByGender).forEach((gender) => {
      groupedByGender[gender].sort((a, b) => {
        const getAgeNumber = (g: any) => {
          if (g.ageGroup && g.ageGroup.startsWith("U")) {
            return parseInt(g.ageGroup.substring(1));
          }
          return 999;
        };
        return getAgeNumber(a) - getAgeNumber(b);
      });
    });

    // Boys first, then Girls
    const sortedGenders = Object.keys(groupedByGender).sort((a, b) => {
      if (a === "Boys" && b === "Girls") return -1;
      if (a === "Girls" && b === "Boys") return 1;
      return a.localeCompare(b);
    });

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {sortedGenders.map((gender) => (
          <div key={gender} className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              {gender}
            </h4>
            <div className="flex flex-wrap gap-2">
              {groupedByGender[gender].map((group) => (
                <span
                  key={group.id}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: hexToRgba(primaryColor, 0.12),
                    color: "rgba(255,255,255,0.85)",
                    border: `1px solid ${hexToRgba(primaryColor, 0.25)}`,
                  }}
                >
                  {group.ageGroup}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      {/* Dark background with event-colored radial glows */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundColor: "#0f0f1a",
          backgroundImage: [
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 3px)",
            "linear-gradient(rgba(124,58,237,0.02) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(124,58,237,0.02) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "100% 3px, 60px 60px, 60px 60px",
        }}
      />

      {/* Primary color glow orb — top right */}
      <div
        className="pointer-events-none fixed z-0"
        style={{
          top: "5%",
          right: "8%",
          width: "350px",
          height: "350px",
          background: `radial-gradient(circle, ${hexToRgba(primaryColor, 0.08)} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Secondary color glow orb — bottom left */}
      <div
        className="pointer-events-none fixed z-0"
        style={{
          bottom: "10%",
          left: "5%",
          width: "280px",
          height: "280px",
          background: `radial-gradient(circle, ${hexToRgba(secondaryColor, 0.06)} 0%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Glassmorphism card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(15, 15, 35, 0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: [
                `0 0 30px ${hexToRgba(primaryColor, 0.1)}`,
                `0 0 60px ${hexToRgba(secondaryColor, 0.05)}`,
                "0 8px 32px rgba(0,0,0,0.3)",
              ].join(", "),
            }}
          >
            {/* Header: Logo or Event Name */}
            <div
              className="px-6 sm:px-8 pt-8 pb-6 text-center"
              style={{
                borderBottom: `1px solid ${hexToRgba(primaryColor, 0.12)}`,
              }}
            >
              {logoUrl ? (
                <div className="mb-4">
                  <img
                    src={logoUrl}
                    alt={`${event.name} logo`}
                    className="max-h-28 object-contain mx-auto"
                    style={{
                      filter: `drop-shadow(0 0 20px ${hexToRgba(primaryColor, 0.3)})`,
                    }}
                  />
                </div>
              ) : null}
              <h1
                className="text-2xl sm:text-3xl font-bold"
                style={
                  logoUrl
                    ? { color: "#ffffff" }
                    : {
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: `drop-shadow(0 0 20px ${hexToRgba(primaryColor, 0.2)})`,
                      }
                }
              >
                {event.name}
              </h1>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 space-y-6">
              {/* Event metadata */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Calendar
                    className="h-5 w-5 mt-0.5 shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                      Event Dates
                    </p>
                    <p className="text-sm text-gray-200">
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      &ndash;{" "}
                      {new Date(event.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Clock
                    className="h-5 w-5 mt-0.5 shrink-0"
                    style={{ color: secondaryColor }}
                  />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                      Registration Deadline
                    </p>
                    <p className="text-sm text-gray-200">
                      {new Date(event.applicationDeadline).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Age groups */}
              {event.ageGroups && event.ageGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users
                      className="h-4 w-4"
                      style={{ color: primaryColor }}
                    />
                    <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      Eligible Age Groups
                    </h3>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {renderAgeGroups(event.ageGroups)}
                  </div>
                </div>
              )}

              {/* Event details HTML */}
              {event.details && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
                    Event Details
                  </h3>
                  <div
                    className="prose prose-sm prose-invert max-w-none rounded-xl p-4"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      "--tw-prose-headings": "rgba(255,255,255,0.9)",
                      "--tw-prose-body": "rgba(255,255,255,0.7)",
                      "--tw-prose-links": primaryColor,
                    } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: event.details }}
                  />
                </div>
              )}

              {/* CTA Button */}
              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleRegisterClick}
                  className="w-full h-12 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    boxShadow: `0 0 20px ${hexToRgba(primaryColor, 0.3)}, 0 0 40px ${hexToRgba(primaryColor, 0.1)}`,
                  }}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {user ? "Proceed to Registration" : "Register Your Team"}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  {user
                    ? `Logged in as ${user.email}`
                    : "You will need to log in or create an account to register."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
