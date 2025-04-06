import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

/**
 * ViewToggle Component
 * 
 * Allows users with admin privileges to toggle between admin and member views.
 * This enables admin users to see their own team registrations in the member dashboard
 * and switch back to full admin view when needed.
 * 
 * The button is hidden when emulation is active to prevent confusion.
 */
export function ViewToggle() {
  const { user, isLoading: userLoading } = useUser();
  const [currentLocation, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state to track view mode
  const [isAdminView, setIsAdminView] = useState(true);
  
  // Check for emulation mode
  const isEmulating = typeof window !== 'undefined' && !!localStorage.getItem('emulationToken');
  
  // Set initial state based on URL path
  useEffect(() => {
    // If on admin route, set to admin view
    const isCurrentlyAdminView = currentLocation.startsWith("/admin");
    setIsAdminView(isCurrentlyAdminView);
  }, [currentLocation]);
  
  // Toggle view function
  const toggleView = useCallback(() => {
    // Toggle state
    const newValue = !isAdminView;
    setIsAdminView(newValue);
    
    // Navigate to appropriate dashboard
    if (newValue) {
      // Switching to admin view
      navigate("/admin");
      toast({
        title: "Admin View",
        description: "You're now viewing the admin dashboard"
      });
    } else {
      // Switching to member view
      navigate("/dashboard");
      toast({
        title: "Member View",
        description: "You're now viewing your member dashboard"
      });
    }
    
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, [isAdminView, navigate, toast, queryClient]);
  
  // Don't render if user is not an admin or if emulation is active
  if (userLoading || !user || !user.isAdmin || isEmulating) {
    return null;
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="rounded-full px-3 gap-1 h-8 text-primary-foreground bg-primary hover:bg-primary/80 border-primary"
      onClick={toggleView}
    >
      <ToggleRight className="h-4 w-4" />
      <span className="text-xs">
        {isAdminView ? "Switch to Member View" : "Switch to Admin View"}
      </span>
    </Button>
  );
}