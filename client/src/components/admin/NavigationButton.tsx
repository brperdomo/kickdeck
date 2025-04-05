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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="w-full"
      onMouseEnter={(e) => {
        const button = e.currentTarget.querySelector('button');
        if (button && !isActive) {
          button.style.backgroundColor = 'var(--admin-nav-hover, #f3f4f6)';
        }
      }}
      onMouseLeave={(e) => {
        const button = e.currentTarget.querySelector('button');
        if (button && !isActive) {
          button.style.backgroundColor = 'transparent';
        }
      }}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start relative overflow-hidden group transition-all duration-300",
          isActive ? "font-medium" : ""
        )}
        onClick={onClick}
        style={{
          backgroundColor: isActive 
            ? 'var(--admin-nav-selected-bg, var(--admin-nav-active))' 
            : 'transparent',
          color: isActive 
            ? 'var(--admin-nav-selected-text, var(--admin-nav-active-text))' 
            : 'var(--admin-nav-text, inherit)',
          boxShadow: 'none',
          borderRadius: '0.375rem',
        }}
      >
        {/* Active indicator - animated bar */}
        {isActive && (
          <motion.div 
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ 
              backgroundColor: 'var(--admin-nav-selected-text, var(--admin-nav-active-text))'
            }}
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* Icon with subtle animation */}
        <span 
          className="mr-2 transition-transform duration-300 group-hover:scale-110"
          style={{ 
            color: isActive 
              ? 'var(--admin-nav-active-icon-color, #FFFFFF)' 
              : 'var(--admin-nav-icon-color, #566A7F)'
          }}
        >
          {icon}
        </span>
        
        {/* Label text */}
        <span>
          {label}
        </span>
      </Button>
    </motion.div>
  );
}