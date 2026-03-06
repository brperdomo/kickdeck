import React, { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const logoutMessages = [
  "See you soon!",
  "Thanks for stopping by!",
  "Have a great day!",
  "Until next time!",
  "Logging you out safely...",
];

interface LogoutOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional extra cleanup to run. The overlay handles session destruction and redirect. */
  onFinished?: () => void;
}

export function LogoutOverlay({ className, onFinished, ...props }: LogoutOverlayProps) {
  const [message] = useState(() => {
    const randomIndex = Math.floor(Math.random() * logoutMessages.length);
    return logoutMessages[randomIndex];
  });

  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const redirectedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;

      // 1. FIRST: Destroy server session and WAIT for completion.
      //    This ensures /api/user returns 401 when the auth page loads.
      try {
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });
      } catch (e) {
        console.error("Logout API error (continuing anyway):", e);
      }

      // 2. Clear all client-side storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Storage clear error:", e);
      }

      // 3. Set logout message (after clear so it's not wiped)
      try {
        sessionStorage.setItem('logout_message', 'You have been successfully logged out');
      } catch (e) {
        // Fallback: URL param will handle message display
      }

      // 4. Run any extra cleanup the parent wants
      try {
        onFinishedRef.current?.();
      } catch (e) {
        console.error("Error in logout cleanup:", e);
      }

      // 5. Redirect — session is destroyed, storage is clean
      window.location.href = "/auth?logged_out=true";
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 animate-in fade-in-0",
        className
      )}
      style={{
        backgroundColor: "rgba(15, 15, 26, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      {...props}
    >
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4">
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "rgba(15, 15, 35, 0.9)",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            boxShadow:
              "0 0 30px rgba(124,58,237,0.1), 0 0 60px rgba(6,182,212,0.05), 0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            {message}
          </h2>
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-violet-500" />
            <p className="text-sm text-gray-400">
              Clearing session data...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
