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
    "z-50 bg-card shadow-md border rounded-full p-1.5",
    {
      "absolute -right-4 top-4": togglePosition === "right",
      "absolute -left-4 top-4": togglePosition === "left",
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
        <AnimatePresence initial={false}>
          {!isCollapsed ? (
            <motion.div
              className={cn(
                "flex flex-col h-screen border-r transition-all",
                width,
                !shouldAutoCollapse ? "relative" : "fixed left-0 top-0 z-40 shadow-lg",
                className
              )}
              style={sidebarStyles}
              initial={{
                x: shouldAutoCollapse ? "-100%" : (defaultCollapsed ? -40 : 0),
                width: shouldAutoCollapse ? width : (defaultCollapsed ? 0 : width)
              }}
              animate={{ 
                x: 0,
                width: width,
              }}
              exit={{
                x: shouldAutoCollapse ? "-100%" : -40,
                width: shouldAutoCollapse ? width : 0
              }}
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
              
              {/* Toggle button */}
              {showToggle && !shouldAutoCollapse && (
                <div className={toggleClasses}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    {togglePosition === "left" || togglePosition === "right" ? (
                      isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <Menu className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Collapsed state */
            <motion.div
              className={cn(
                "flex flex-col h-screen border-r transition-all",
                "w-2", // Very narrow when collapsed on desktop
                !shouldAutoCollapse ? "relative" : "", // Only position relative when on desktop
                className
              )}
              style={sidebarStyles}
              initial={{ width: shouldAutoCollapse ? 0 : 40 }}
              animate={{ width: shouldAutoCollapse ? 0 : 10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {/* Toggle button in collapsed state */}
              {showToggle && !shouldAutoCollapse && (
                <div className={toggleClasses}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    {togglePosition === "left" || togglePosition === "right" ? (
                      isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <Menu className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
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