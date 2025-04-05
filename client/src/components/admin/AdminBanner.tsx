import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { ViewToggle } from "@/components/ViewToggle";

/**
 * AdminBanner component displays a navigation bar at the top of admin pages
 * for consistent navigation and access to common admin functions
 */
export function AdminBanner() {
  const [location, navigate] = useLocation();
  const isRootAdmin = location === "/admin" || location === "/admin/events";
  const { settings } = useOrganizationSettings();
  
  return (
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
            {/* Page title - dynamically determined */}
            <motion.h2 
              className="text-xl font-semibold hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Admin {getBannerTitle(location)}
            </motion.h2>
          </motion.div>
        </div>

        {/* Right-side tools */}
        <div className="flex items-center space-x-3">
          {/* View Toggle - Switch between Admin/Member views */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ViewToggle />
          </motion.div>
          
          {/* Search - hidden on mobile */}
          <motion.div 
            className="relative hidden md:block"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-[200px] lg:w-[300px] h-9"
            />
          </motion.div>
          
          {/* Notifications */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button variant="ghost" size="icon" title="Notifications">
              <Bell className="h-5 w-5" />
              <motion.span 
                className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
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