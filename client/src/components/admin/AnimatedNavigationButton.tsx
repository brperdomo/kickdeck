import React from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedNavigationButtonProps {
  view: string;
  activeView: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  permission?: string;
  index?: number;
}

// Animation variants for the navigation items
const buttonVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: (index = 0) => ({ 
    opacity: 1,
    y: 0,
    transition: { 
      delay: 0.1 + (index * 0.05),
      duration: 0.4,
      type: "spring", 
      stiffness: 200
    }
  }),
  hover: { 
    scale: 1.02,
    transition: { 
      duration: 0.2 
    }
  },
  tap: { 
    scale: 0.98,
    transition: { 
      duration: 0.1 
    }
  }
};

export function AnimatedNavigationButton({ 
  view, 
  activeView, 
  onClick, 
  icon, 
  label, 
  permission,
  index = 0
}: AnimatedNavigationButtonProps) {
  const { hasPermission } = usePermissions();
  
  // If user doesn't have permission, don't render the button
  if (permission && !hasPermission(permission as any)) {
    return null;
  }

  const isActive = activeView === view;

  return (
    <motion.div
      custom={index}
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
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
          "w-full justify-start relative overflow-hidden group",
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
        <motion.span 
          className="mr-2 relative transition-transform duration-300 group-hover:scale-110"
          style={{ 
            color: isActive 
              ? 'var(--admin-nav-active-icon-color, #FFFFFF)' 
              : 'var(--admin-nav-icon-color, #566A7F)'
          }}
          animate={{ 
            rotate: isActive ? [0, 5, 0] : 0
          }}
          transition={{ 
            duration: 0.3,
            type: "spring"
          }}
        >
          {icon}
        </motion.span>
        
        {/* Label text */}
        <span>
          {label}
        </span>
      </Button>
    </motion.div>
  );
}