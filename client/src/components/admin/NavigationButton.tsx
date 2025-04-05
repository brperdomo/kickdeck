import React from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavigationButtonProps {
  view: string;
  activeView: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  permission?: string;
}

/**
 * Animated navigation button for sidebar navigation
 */
export function NavigationButton({ 
  view, 
  activeView, 
  onClick, 
  icon, 
  label, 
  permission 
}: NavigationButtonProps) {
  const { hasPermission } = usePermissions();
  
  // If user doesn't have permission, don't render the button
  if (permission && !hasPermission(permission as any)) {
    return null;
  }

  const isActive = activeView === view;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          "w-full justify-start relative overflow-hidden group transition-all duration-300",
          isActive ? "font-medium" : ""
        )}
        onClick={onClick}
      >
        {/* Active indicator - animated bar */}
        {isActive && (
          <motion.div 
            className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* Icon with subtle animation */}
        <span className={cn(
          "mr-2 transition-transform duration-300 group-hover:scale-110",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          {icon}
        </span>
        
        {/* Label text */}
        <span className={cn(
          isActive ? "text-foreground" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </Button>
    </motion.div>
  );
}