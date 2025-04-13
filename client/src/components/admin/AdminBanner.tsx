import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, UserCog, Users, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { ViewToggle } from "@/components/ViewToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [emulationMenuOpen, setEmulationMenuOpen] = useState(false);
  
  // Check if we're emulating directly from sessionStorage for initial render
  const isEmulating = typeof window !== 'undefined' && sessionStorage.getItem('emulationActive') === 'true';
  const emulatedName = typeof window !== 'undefined' ? sessionStorage.getItem('emulatedAdminName') : null;
  
  // Fetch available administrators that can be emulated
  const { data: adminsData } = useQuery({
    queryKey: ['emulatable-admins'],
    queryFn: async () => {
      const response = await fetch('/api/admin/emulation/admins');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch emulatable administrators');
      }
      return response.json();
    },
    enabled: emulationMenuOpen, // Only fetch when menu is opened
  });

  // Start emulation mutation
  const startEmulationMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await fetch(`/api/admin/emulation/start/${adminId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start emulation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      try {
        // Set emulation token in localStorage
        if (data && data.token) {
          localStorage.setItem('emulationToken', data.token);
          
          // Set a session storage flag to prevent state loss on reload
          sessionStorage.setItem('emulationActive', 'true');
          sessionStorage.setItem('emulatedAdminName', `${data.emulatedAdmin.firstName} ${data.emulatedAdmin.lastName}`);
          
          // Store roles if available
          if (data.emulatedAdmin.roles) {
            sessionStorage.setItem('emulatedRoles', JSON.stringify(data.emulatedAdmin.roles));
          }
        }
        
        // First show toast before reload
        toast({
          title: 'Emulation Started',
          description: `You are now viewing the system as ${data.emulatedAdmin.firstName} ${data.emulatedAdmin.lastName}`,
        });
        
        // Wait a bit longer to ensure the token is properly saved
        setTimeout(() => {
          // Invalidate all queries to force refetch with new token
          queryClient.invalidateQueries();
          
          // Force refresh key queries
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
          
          // Reload the page to ensure all components update properly
          window.location.href = '/admin';
        }, 1000);
      } catch (error) {
        console.error('Error in emulation success handler:', error);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Emulation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handle stopping emulation
  const handleStopEmulation = async () => {
    const token = localStorage.getItem('emulationToken');
    if (!token) return;

    try {
      // Show toast first
      toast({
        title: 'Emulation Stopped',
        description: 'You are now viewing the system as yourself',
      });

      const response = await fetch(`/api/admin/emulation/stop/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
      });

      // Always clean up the client storage
      localStorage.removeItem('emulationToken');
      sessionStorage.removeItem('emulationActive');
      sessionStorage.removeItem('emulatedAdminName');
      sessionStorage.removeItem('emulatedRoles');

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error stopping emulation:", errorData);
      }

      // Wait a brief moment to ensure the toast is displayed
      setTimeout(() => {
        // Force refresh all queries with the new identity
        queryClient.invalidateQueries();
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
        
        // Reload the page to ensure UI updates properly
        window.location.href = '/admin';
      }, 1000);
    } catch (error) {
      toast({
        title: 'Emulation Reset',
        description: 'Emulation mode has been reset due to an error',
        variant: 'destructive',
      });
      console.error("Error in emulation stop handler:", error);
      localStorage.removeItem('emulationToken');
      sessionStorage.removeItem('emulationActive');
      sessionStorage.removeItem('emulatedAdminName');
      sessionStorage.removeItem('emulatedRoles');
    }
  };
  
  return (
    <>
      {/* Emulation status bar - shown above the regular banner when emulating */}
      {isEmulating && (
        <div className="w-full bg-red-100 border-b border-red-300 py-2">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <UserCog className="text-red-600 h-5 w-5 mr-2" />
                <p className="text-red-800 font-medium">
                  <span className="font-bold">EMULATION MODE:</span> 
                  {emulatedName ? ` Viewing as ${emulatedName}` : ' Viewing as another administrator'}
                </p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleStopEmulation}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Exit Emulation
              </Button>
            </div>
          </div>
        </div>
      )}
    
      {/* Regular admin banner */}
      <motion.div 
        className="bg-card/50 backdrop-blur-sm p-4 border-b sticky top-0 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back button - only show when not on root admin */}
            {!isRootAdmin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin")}
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
            
            {/* Home button - always visible */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                title="Home"
              >
                <Home className="h-5 w-5" />
              </Button>
            </motion.div>
            
            {/* MatchPro Logo */}
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <img 
                src={settings?.logoUrl || "/attached_assets/MatchPro.ai_Stacked_Color.png"} 
                alt="MatchPro" 
                className="h-8 mr-2"
              />
              {/* Page title removed as requested */}
            </motion.div>
          </div>
          
          {/* Right-side tools */}
          <div className="flex items-center space-x-3">
            {/* Emulation Button - Only show when not already emulating */}
            {!isEmulating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Popover open={emulationMenuOpen} onOpenChange={setEmulationMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full px-3 gap-1 h-8 hover:bg-primary/10"
                    >
                      <UserCog className="h-4 w-4" />
                      <span className="text-xs hidden md:inline-block">
                        Emulate User
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-primary" />
                        <h4 className="font-medium">Emulate Administrator</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select an administrator to view the system from their perspective:
                      </p>
                      
                      {adminsData && adminsData.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {adminsData.map((admin: any) => (
                            <div 
                              key={admin.id}
                              className="flex items-center justify-between rounded-md border p-2 hover:bg-muted cursor-pointer"
                              onClick={() => {
                                startEmulationMutation.mutate(admin.id);
                                setEmulationMenuOpen(false);
                              }}
                            >
                              <div>
                                <div className="font-medium text-sm">
                                  {admin.firstName} {admin.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {admin.email}
                                </div>
                                {admin.roles && admin.roles.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {admin.roles.map((role: string) => (
                                      <Badge key={role} variant="outline" className="text-xs">
                                        {role.replace('_', ' ')}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button size="sm" variant="ghost">
                                <Users className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 text-center">
                          {emulationMenuOpen ? 'Loading administrators...' : 'No administrators available'}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </motion.div>
            )}
            
            {/* View Toggle - Switch between Admin/Member views */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ViewToggle />
            </motion.div>
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