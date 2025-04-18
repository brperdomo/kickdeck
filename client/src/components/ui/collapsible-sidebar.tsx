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

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  mobileBreakpoint?: 'sm' | 'md' | 'lg'; // Size at which to switch to mobile view
  collapseBreakpoint?: string; // Alias for mobileBreakpoint for backward compatibility
  collapsedWidth?: string;
  expandedWidth?: string;
  position?: 'left' | 'right';
  showToggle?: boolean;
  sidebarStyles?: React.CSSProperties;
  headerContent?: React.ReactNode;
}

export function CollapsibleSidebar({
  children,
  className,
  defaultCollapsed = false,
  mobileBreakpoint = 'md',
  collapsedWidth = '72px',
  expandedWidth = '240px',
  position = 'left',
  showToggle = true,
  sidebarStyles = {},
  headerContent
}: CollapsibleSidebarProps) {
  // State for collapsed status on desktop
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { isMobile, isTablet, isDesktop } = useMobileContext();
  
  // Whether we're in mobile view
  const isMobileView = isMobile || (mobileBreakpoint === 'lg' && isTablet);
  
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
    setIsCollapsed(!isCollapsed);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  if (isMobileView) {
    return (
      <>
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50 px-2"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Mobile sidebar (sheet from the side) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent
            side={position}
            className={cn(
              "p-0 w-80",
              className
            )}
          >
            <div className="h-full overflow-y-auto flex flex-col">
            {headerContent && (
              <div className="p-4 border-b">
                {headerContent}
              </div>
            )}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }
  
  return (
    <div
      className={cn(
        "relative h-full transition-all duration-300 ease-in-out border-r bg-card",
        isCollapsed ? `w-[${collapsedWidth}]` : `w-[${expandedWidth}]`,
        className
      )}
      style={{ 
        width: isCollapsed ? collapsedWidth : expandedWidth,
        ...sidebarStyles
      }}
    >
      {/* Desktop sidebar content */}
      <div className="h-full overflow-hidden flex flex-col">
        {headerContent && (
          <div className="p-4 border-b">
            {headerContent}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
      
      {/* Toggle button */}
      {showToggle && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute -right-3 top-16 rounded-full w-6 h-6 p-0 bg-background border shadow-sm",
            position === "right" && "-left-3 right-auto"
          )}
          onClick={toggleCollapse}
        >
          {isCollapsed ? (
            position === "left" ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />
          ) : (
            position === "left" ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}