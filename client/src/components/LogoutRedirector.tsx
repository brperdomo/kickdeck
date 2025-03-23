import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface LogoutRedirectorProps {
  className?: string;
}

const logoutMessages = [
  "See you later, soccer star! ⚽",
  "Taking a water break! 🥤",
  "Switching teams for now! 🔄",
  "Game over for today! 🏆",
  "Halftime break! ⏱️",
  "Red card! Just kidding, you're welcome back anytime! 🟥",
  "Penalty kick! You scored a successful logout! ⚽",
  "Substitution! You're being benched for now! 🔄",
  "Final whistle! Good game! 🏁",
  "Heading to the locker room! 🚪"
];

export function LogoutRedirector({ className }: LogoutRedirectorProps) {
  const [message, setMessage] = useState<string>("");
  
  useEffect(() => {
    // Show random message
    const randomMessage = logoutMessages[Math.floor(Math.random() * logoutMessages.length)];
    setMessage(randomMessage);
    
    // Show toast notification
    toast({
      title: "Logging out",
      description: "Cleaning up your session...",
    });
    
    // Clear all browser data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    // Set timeout for redirection (short enough to see message, but not too long to wait)
    const redirectTimer = setTimeout(() => {
      // Force page refresh and redirect to root
      window.location.href = "/";
    }, 1500);

    return () => clearTimeout(redirectTimer);
  }, []);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-[#4A154B]/80 backdrop-blur-sm",
        "animate-in fade-in-0",
        className
      )}
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