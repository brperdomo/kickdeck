import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

/**
 * ForceRedirectCombinedFix
 * 
 * This is a last-resort component to fix redirection issues.
 * It uses multiple methods to force a redirect to the appropriate dashboard.
 */
export function ForceRedirectCombinedFix() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log("ForceRedirect: No user found, can't redirect");
      return;
    }

    console.log("ForceRedirect: User found, redirecting to appropriate dashboard");
    const targetPath = user.isAdmin ? '/admin/dashboard' : '/dashboard';
    
    // Store the redirect information in localStorage
    localStorage.setItem('forced_redirect_target', targetPath);
    localStorage.setItem('forced_redirect_timestamp', Date.now().toString());
    
    // First, try using history API
    console.log(`ForceRedirect: Using history.pushState to ${targetPath}`);
    try {
      window.history.pushState({}, '', targetPath);
    } catch (e) {
      console.error("ForceRedirect: history.pushState failed", e);
    }
    
    // Then, use direct location change after a short delay
    setTimeout(() => {
      console.log(`ForceRedirect: Using direct location change to ${targetPath}`);
      window.location.href = targetPath;
    }, 100);
    
  }, [user]);

  return null; // This component doesn't render anything
}