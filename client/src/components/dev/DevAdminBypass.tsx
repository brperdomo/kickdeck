import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { LockIcon, UnlockIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

/**
 * Development-only component to bypass authentication for admin testing
 * Should NOT be included in production builds
 */
export default function DevAdminBypass() {
  const [loading, setLoading] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  
  // Only show in development environments and not in auth pages
  const isDev = import.meta.env.MODE === 'development';
  const isAuthPage = location.includes('/auth') || location.includes('/login') || location.includes('/register');
  
  // Don't show if already authenticated as admin
  if (!isDev || isAuthPage || isLoading || (user && user.isAdmin)) {
    return null;
  }
  
  const loginAsAdmin = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/auth/dev-login-bypass");
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Development Mode",
          description: `Logged in as admin: ${data.user.username}`,
          variant: "default"
        });
        
        // Reload the page to update auth state everywhere
        window.location.href = '/admin';
      } else {
        throw new Error(data.message || "Authentication bypass failed");
      }
    } catch (error) {
      console.error("Dev login error:", error);
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Failed to log in as admin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={loginAsAdmin}
        disabled={loading}
        className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          <span className="flex items-center">
            <UnlockIcon className="h-4 w-4 mr-2" />
            Dev Login (Admin)
          </span>
        )}
      </Button>
    </div>
  );
}