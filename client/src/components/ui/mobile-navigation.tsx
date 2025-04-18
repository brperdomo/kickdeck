import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface MobileNavigationProps {
  items: NavigationItem[];
  className?: string;
}

export function MobileNavigation({ items, className }: MobileNavigationProps) {
  const { isMobile } = useBreakpoint();
  const [location] = useLocation();
  
  if (!isMobile) {
    return null;
  }
  
  return (
    <nav className={cn(
      "mobile-nav-fixed ios-safe-area-bottom",
      className
    )}>
      {items.map((item) => {
        const isActive = item.exact 
          ? location === item.href 
          : location.startsWith(item.href);
          
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "mobile-nav-item",
              isActive && "active"
            )}
          >
            <div className="mobile-nav-item-icon">
              {item.icon}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

interface MobileHeaderProps {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({ 
  title, 
  leftAction, 
  rightAction,
  className 
}: MobileHeaderProps) {
  const { isMobile } = useBreakpoint();
  
  if (!isMobile) {
    return null;
  }
  
  return (
    <header className={cn(
      "mobile-header",
      className
    )}>
      <div className="flex items-center gap-3">
        {leftAction && (
          <div className="touch-target flex items-center justify-center">
            {leftAction}
          </div>
        )}
        <h1 className="mobile-header-title truncate">{title}</h1>
      </div>
      
      {rightAction && (
        <div className="touch-target flex items-center justify-center">
          {rightAction}
        </div>
      )}
    </header>
  );
}

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className
}: MobileBottomSheetProps) {
  const { isMobile } = useBreakpoint();
  
  if (!isMobile) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "mobile-bottom-sheet ios-safe-area-bottom",
              className
            )}
          >
            <div className="mobile-bottom-sheet-handle" />
            
            {title && (
              <div className="mobile-bottom-sheet-header">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button
                  type="button"
                  className="touch-target rounded-full p-2 hover:bg-muted"
                  onClick={onClose}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}