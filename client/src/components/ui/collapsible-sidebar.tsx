import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMobileContext } from "@/hooks/use-mobile";
import { Menu, X, ChevronRight, ChevronLeft } from "lucide-react";

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  showOnDesktop?: boolean;
  showToggleOnDesktop?: boolean;
  defaultCollapsed?: boolean;
  collapseBreakpoint?: "sm" | "md" | "lg";
  className?: string;
  headerContent?: React.ReactNode;
  togglePosition?: "top" | "bottom" | "left" | "right";
  width?: string;
  sidebarStyles?: React.CSSProperties;
}

/**
 * CollapsibleSidebar Component
 * 
 * A responsive sidebar that can be collapsed on both mobile and desktop
 * with animation support and customizable behavior
 */
export function CollapsibleSidebar({
  children,
  showOnDesktop = true,
  showToggleOnDesktop = false,
  defaultCollapsed = false,
  collapseBreakpoint = "md",
  className,
  headerContent,
  togglePosition = "left",
  width = "w-64",
  sidebarStyles
}: CollapsibleSidebarProps) {
  const { isMobile, isTablet, smUp, mdUp, lgUp } = useMobileContext();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [initialRender, setInitialRender] = useState(true);
  
  // Determine if the sidebar should be auto-collapsed based on screen size
  const shouldAutoCollapse = 
    collapseBreakpoint === "sm" ? !smUp :
    collapseBreakpoint === "md" ? !mdUp :
    collapseBreakpoint === "lg" ? !lgUp : false;
  
  // Update collapse state on resize
  useEffect(() => {
    if (initialRender) {
      setIsCollapsed(defaultCollapsed || shouldAutoCollapse);
      setInitialRender(false);
    } else {
      setIsCollapsed(shouldAutoCollapse ? true : isCollapsed);
    }
  }, [shouldAutoCollapse]);
  
  // Don't show the sidebar at all if not needed
  if (!showOnDesktop && !isMobile && !isTablet) {
    return null;
  }
  
  // Calculate if toggle button should be shown
  const showToggle = (isMobile || isTablet || showToggleOnDesktop);
  
  // Calculate the classes for the toggle button based on position
  const toggleClasses = cn(
    "z-50 bg-primary/90 shadow-sm border border-primary/10 rounded-sm p-0.5 flex items-center justify-center",
    {
      "absolute -right-4 top-1/2 -translate-y-1/2 h-7": togglePosition === "right",
      "absolute -left-4 top-1/2 -translate-y-1/2 h-7": togglePosition === "left",
      "absolute top-4 right-4": togglePosition === "top",
      "absolute bottom-4 right-4": togglePosition === "bottom",
    }
  );
  
  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      <AnimatePresence>
        {!isCollapsed && shouldAutoCollapse && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
          />
        )}
      </AnimatePresence>
      
      {/* Main sidebar */}
      <div className="relative">
        {/* Expanded sidebar */}
        {!isCollapsed && (
          <motion.div
            className={cn(
              "flex flex-col h-screen border-r transition-all",
              width,
              !shouldAutoCollapse ? "relative" : "fixed left-0 top-0 z-40 shadow-lg",
              className
            )}
            style={sidebarStyles}
            initial={{ x: shouldAutoCollapse ? "-100%" : -40 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Sidebar header if provided */}
            {headerContent && (
              <div className="flex items-center justify-between p-4 border-b">
                {headerContent}
                
                {/* Close button on mobile */}
                {shouldAutoCollapse && (
                  <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)}>
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
            
            {/* Toggle button for expanded state */}
            {showToggle && !shouldAutoCollapse && (
              <div className={toggleClasses}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground p-0 h-5 w-5"
                  onClick={() => setIsCollapsed(true)}
                >
                  {togglePosition === "left" || togglePosition === "right" ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : (
                    <Menu className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Collapsed sidebar - just a placeholder */}
        {isCollapsed && !shouldAutoCollapse && (
          <div className="relative h-screen">
            <div 
              className={cn(
                "h-screen border-r w-2 relative", 
                className
              )}
              style={sidebarStyles}
            />
            
            {/* Expand button */}
            {showToggle && (
              <div className={toggleClasses}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground p-0 h-5 w-5"
                  onClick={() => setIsCollapsed(false)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Mobile toggle button */}
        {shouldAutoCollapse && isCollapsed && (
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-30 shadow-md" 
            onClick={() => setIsCollapsed(false)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>
    </>
  );
}