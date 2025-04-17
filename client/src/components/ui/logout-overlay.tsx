import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { QueryClient } from "@tanstack/react-query"

const logoutMessages = [
  "See you soon! 👋",
  "Thanks for stopping by! ⭐",
  "Have a great day! 🌟",
  "Catch you on the flip side! 🎵",
  "Taking a break? We'll be here! ⚡",
  "Until next time! 🌈",
  "Logging you out safely... 🔒",
  "Thanks for playing! ⚽"
];

interface LogoutOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  onFinished: () => void;
}

export function LogoutOverlay({ className, onFinished, ...props }: LogoutOverlayProps) {
  const [message] = useState(() => {
    const randomIndex = Math.floor(Math.random() * logoutMessages.length);
    return logoutMessages[randomIndex];
  });

  useEffect(() => {
    // Clear any browser storage immediately
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Also try to clear any cookies by setting them to expire
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      // Clear browser cache for API endpoints
      if (window.caches) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
    } catch (e) {
      console.error("Error clearing browser data during logout:", e);
    }
    
    // Show the message for a moment before redirecting
    const redirectTimer = setTimeout(() => {
      onFinished();
      
      // Force redirect as a fallback if the callback doesn't work
      setTimeout(() => {
        console.log("Forcing logout redirect via fallback");
        window.location.href = "/auth?logged_out=true";
      }, 200);
    }, 1500); // Show the message for 1.5 seconds

    return () => clearTimeout(redirectTimer);
  }, [onFinished]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-[#4A154B]/80 backdrop-blur-sm",
        "animate-in fade-in-0",
        className
      )}
      {...props}
    >
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4">
        <Card className="border-[#36C5F0] bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <h2 
                className="text-2xl font-semibold tracking-tight first:mt-0 text-[#1D1C1D]"
                style={{ 
                  fontFamily: "'Lato', 'Open Sans', sans-serif",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}
              >
                {message}
              </h2>
              <div className="mt-2 flex flex-col items-center">
                <div className="mb-2 animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#36C5F0]"></div>
                <p className="text-sm text-muted-foreground">
                  Clearing session data...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}