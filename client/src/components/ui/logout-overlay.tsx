
import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

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
    // Randomly select a message when component mounts
    const randomIndex = Math.floor(Math.random() * logoutMessages.length);
    return logoutMessages[randomIndex];
  });

  useEffect(() => {
    // After 1.5 seconds, trigger the finished callback
    const timer = setTimeout(() => {
      onFinished();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        "animate-in fade-in-0",
        className
      )}
      {...props}
    >
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-tight first:mt-0">
                {message}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
