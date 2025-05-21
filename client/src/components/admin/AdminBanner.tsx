import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { ViewToggle } from "@/components/ViewToggle";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

/**
 * AdminBanner component displays a navigation bar at the top of admin pages
 * for consistent navigation and access to common admin functions
 */
export function AdminBanner() {
  const [location, navigate] = useLocation();
  const isRootAdmin = location === "/admin" || location === "/admin/events";
  const { settings } = useOrganizationSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle logging out
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Clear any user data from the query cache
        queryClient.invalidateQueries({ queryKey: ['user'] });
        
        // Redirect to login page
        navigate('/login');
        
        toast({
          title: 'Logged Out',
          description: 'You have been successfully logged out',
        });
      } else {
        toast({
          title: 'Logout Failed',
          description: 'There was an error logging out. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'Logout Failed',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <>
      <motion.div 
        className={cn(
          "relative border-b w-full border-border/40 bg-background shadow-sm",
          isRootAdmin ? "shadow-lg" : ""
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center justify-between">
            {/* Left section - Logo/Title */}
            <div className="flex items-center gap-4 md:gap-6">
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin')}
                style={{ cursor: 'pointer' }}
              >
                <Users className="h-5 w-5" />
              </motion.div>
                
              <div className="flex flex-col">
                <h1 className="flex items-center gap-1.5 text-lg font-semibold leading-tight tracking-tight text-foreground">
                  {getBannerTitle(location)}
                  {location === "/admin" && (
                    <Badge variant="secondary" className="text-[0.65rem] px-1 py-0 font-normal opacity-80">
                      Administrator
                    </Badge>
                  )}
                </h1>
                {settings?.name && (
                  <span className="text-xs text-muted-foreground">
                    {settings.name}
                  </span>
                )}
              </div>
            </div>
              
            {/* Right section - Actions */}
            <div className="flex items-center space-x-3">
              {/* View Toggle - Switch between Admin/Member views */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <ViewToggle />
              </motion.div>
              
              {/* Logout button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full px-3 gap-1 h-8"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-xs hidden md:inline-block">
                    Logout
                  </span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Helper function to get the banner title based on current location
function getBannerTitle(path: string): string {
  // Extract the main section from the path
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length < 2) return "Dashboard";
  
  // Handle special cases
  if (pathParts[1] === 'events') {
    if (pathParts.length === 2) return "Events";
    if (pathParts[2] === 'create') return "Create Event";
    if (pathParts[2] === 'edit') return "Edit Event";
    if (pathParts[3] === 'fees') return "Event Fees";
    if (pathParts[3] === 'coupons') return "Event Coupons";
  }
  
  // Default transformations for other sections
  const section = pathParts[1]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return section;
}