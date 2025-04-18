import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMobileContext } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  mobileBreakpoint?: 'sm' | 'md' | 'lg'; // Size at which to switch to mobile view
  collapseBreakpoint?: string; // Alias for mobileBreakpoint for backward compatibility
  collapsedWidth?: string;
  expandedWidth?: string;
  width?: string; // Alias for expandedWidth for backward compatibility
  position?: 'left' | 'right';
  showToggle?: boolean;
  showToggleOnDesktop?: boolean; // Alias for showToggle for backward compatibility
  togglePosition?: string; // Position of the toggle button
  sidebarStyles?: React.CSSProperties;
  headerContent?: React.ReactNode;
}

export function CollapsibleSidebar({
  children,
  className,
  defaultCollapsed = false,
  mobileBreakpoint = 'md',
  collapseBreakpoint,
  collapsedWidth = '72px',
  expandedWidth = '240px',
  width,
  position = 'left',
  showToggle = true,
  showToggleOnDesktop,
  togglePosition,
  sidebarStyles = {},
  headerContent
}: CollapsibleSidebarProps) {
  // State for collapsed status on desktop
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { isMobile, isTablet, isDesktop } = useMobileContext();
  
  // Handle backward compatibility parameters
  const actualMobileBreakpoint = collapseBreakpoint || mobileBreakpoint;
  
  // Handle width that might be passed as "w-64" format
  let actualExpandedWidth = width || expandedWidth;
  if (actualExpandedWidth && typeof actualExpandedWidth === 'string' && actualExpandedWidth.startsWith('w-')) {
    actualExpandedWidth = actualExpandedWidth.replace('w-', '');
  }
  
  const actualShowToggle = showToggleOnDesktop !== undefined ? showToggleOnDesktop : showToggle;
  
  // Whether we're in mobile view
  const isMobileView = isMobile || (actualMobileBreakpoint === 'lg' && isTablet);
  
  // Reset collapse state when switching between mobile and desktop
  useEffect(() => {
    if (isMobileView) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(defaultCollapsed);
    }
  }, [isMobileView, defaultCollapsed]);
  
  // Toggle sidebar collapsed state
  const toggleCollapse = () => {
    console.log(`Toggle clicked: Current state=${isCollapsed}, changing to ${!isCollapsed}`);
    setIsCollapsed(prevState => !prevState);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Mobile view with slide-out menu
  if (isMobileView) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50 px-2"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side={position}
            className={cn("p-0 w-80", className)}
          >
            <div className="h-full flex flex-col">
              {headerContent && (
                <div className="p-4 border-b">
                  {headerContent}
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }
  
  // Desktop view with collapsible sidebar
  return (
    <motion.div
      className={cn("relative h-full border-r bg-card overflow-hidden", className)}
      initial={false}
      animate={{ 
        width: isCollapsed ? collapsedWidth : actualExpandedWidth 
      }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 26
      }}
      style={{
        ...sidebarStyles,
        // Force hardware acceleration for smoother transitions
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)'
      }}
    >
      <div className="h-full flex flex-col">
        {headerContent && (
          <div className="p-4 border-b">
            {headerContent}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
      
      {actualShowToggle && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute z-10 -right-4 top-16 rounded-full w-8 h-8 p-0 bg-background border border-primary/20 shadow-md hover:shadow-lg hover:border-primary/50 hover:bg-primary/5",
            position === "right" && "-left-4 right-auto",
            togglePosition === "bottom" && "top-auto bottom-16"
          )}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={isCollapsed ? "collapsed" : "expanded"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isCollapsed ? (
                position === "left" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
              ) : (
                position === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      )}
    </motion.div>
  );
}