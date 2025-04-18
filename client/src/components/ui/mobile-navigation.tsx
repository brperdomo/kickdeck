import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { Separator } from "./separator";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  onClick?: () => void;
};

interface MobileNavigationProps {
  items: NavigationItem[];
  className?: string;
}

interface MobileHeaderProps {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Mobile bottom navigation bar component
 */
export function MobileNavigation({ items, className }: MobileNavigationProps) {
  const [location] = useLocation();
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background border-t z-40 px-2 pt-2 pb-5 shadow-lg",
      "safe-area-bottom", // Apply safe area inset for iOS
      className
    )}>
      <div className="grid grid-cols-4 gap-1">
        {items.map((item, index) => {
          const isActive = item.exact 
            ? location === item.href
            : location.startsWith(item.href) && item.href !== "#";
            
          const handleClick = (e: React.MouseEvent) => {
            if (item.onClick) {
              e.preventDefault();
              item.onClick();
            }
          };
          
          return (
            <div key={index} className="flex flex-col items-center">
              {item.href === "#" ? (
                <button
                  onClick={handleClick}
                  className={cn(
                    "flex flex-col items-center justify-center w-full p-2 rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 w-1 h-1 bg-primary rounded-full transform -translate-x-1/2"></span>
                    )}
                  </div>
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ) : (
                <a
                  href={item.href}
                  onClick={handleClick}
                  className={cn(
                    "flex flex-col items-center justify-center w-full p-2 rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 w-1 h-1 bg-primary rounded-full transform -translate-x-1/2"></span>
                    )}
                  </div>
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Mobile header component with customizable actions
 */
export function MobileHeader({ 
  title, 
  leftAction, 
  rightAction, 
  showBackButton = false,
  onBack,
  className
}: MobileHeaderProps) {
  const [, navigate] = useLocation();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default behavior is to go back in history
      window.history.back();
    }
  };
  
  return (
    <header className={cn(
      "sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background border-b",
      "safe-area-top", // Apply safe area inset for iOS
      className
    )}>
      <div className="flex-1 flex justify-start">
        {showBackButton ? (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : leftAction || <div className="w-8" />}
      </div>
      
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </div>
      
      <div className="flex-1 flex justify-end">
        {rightAction || <div className="w-8" />}
      </div>
    </header>
  );
}

/**
 * Mobile bottom sheet component for menus and actions
 */
export function MobileBottomSheet({ isOpen, onClose, title, children }: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Close the sheet when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when sheet is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore body scrolling when sheet is closed
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 touch-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-xl shadow-lg max-h-[80vh] overflow-hidden flex flex-col safe-area-bottom"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Content with scroll */}
            <div className="overflow-auto p-4 flex-grow">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}