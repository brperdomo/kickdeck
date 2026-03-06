import { useEffect, useState, useRef } from 'react';

const logoutMessages = [
  "See you soon!",
  "Thanks for stopping by!",
  "Have a great day!",
  "Until next time!",
  "Logging you out safely...",
];

export function LogoutHandler() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  // Pick a random message once
  const [message] = useState(() => {
    const idx = Math.floor(Math.random() * logoutMessages.length);
    return logoutMessages[idx];
  });

  useEffect(() => {
    if (redirectedRef.current) return;

    const doLogout = async () => {
      try {
        // Gate: prevent duplicate calls
        if (sessionStorage.getItem('logout_in_progress')) {
          redirectedRef.current = true;
          window.location.href = '/auth?logged_out=true';
          return;
        }
        sessionStorage.setItem('logout_in_progress', 'true');

        // 1. Broadcast to other tabs
        try {
          const bc = new BroadcastChannel('app-logout');
          bc.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
          bc.close();
        } catch (_) { /* BroadcastChannel not supported */ }

        // 2. Destroy the server session and WAIT for completion.
        //    This ensures /api/user returns 401 when the auth page loads.
        try {
          await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
          });
        } catch (e) {
          console.error('Logout API error (continuing):', e);
        }

        // 3. Clear localStorage (removes ETag cache, emulation tokens, etc.)
        try {
          localStorage.clear();
        } catch (e) {
          console.error('localStorage clear error:', e);
        }

        // 4. Clear sessionStorage and set the logout message.
        //    The message MUST be set before any React state change that could
        //    cause the Router to unmount this component and render AuthPage.
        try {
          sessionStorage.clear();
          sessionStorage.setItem('logout_message', 'You have been successfully logged out');
        } catch (e) {
          console.error('sessionStorage error:', e);
        }

        // 5. Redirect with FULL PAGE RELOAD — this restarts React from scratch.
        //    React Query cache is automatically empty on a fresh page load.
        //    Do NOT call queryClient.clear() here — it triggers a synchronous
        //    re-render that unmounts this component before the redirect fires.
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          window.location.href = '/auth?logged_out=true';
        }
      } catch (error) {
        console.error('Critical error during logout:', error);
        setErrorMessage('Error during logout. Redirecting...');

        if (!redirectedRef.current) {
          redirectedRef.current = true;
          try {
            sessionStorage.setItem('logout_message', 'You have been successfully logged out');
          } catch (_) {}
          window.location.href = '/auth?logged_out=true';
        }
      }
    };

    // Short delay so the overlay is visible before processing
    const startTimer = setTimeout(doLogout, 800);

    // Fallback: if everything hangs, redirect after 5s
    const fallbackTimer = setTimeout(() => {
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        try {
          sessionStorage.setItem('logout_message', 'You have been successfully logged out');
        } catch (_) {}
        window.location.href = '/auth?logged_out=true';
      }
    }, 5000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        backgroundColor: 'rgba(15, 15, 26, 0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4">
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(15, 15, 35, 0.9)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            boxShadow:
              '0 0 30px rgba(124,58,237,0.1), 0 0 60px rgba(6,182,212,0.05), 0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {errorMessage ? (
            <h2 className="text-xl font-semibold text-red-400 mb-4">{errorMessage}</h2>
          ) : (
            <h2 className="text-xl font-semibold text-white mb-4">{message}</h2>
          )}
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-violet-500" />
            <p className="text-sm text-gray-400">Clearing session data...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
