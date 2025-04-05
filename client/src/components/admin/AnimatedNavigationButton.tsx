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
    >
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          "w-full justify-start relative overflow-hidden",
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
        <motion.span 
          className={cn(
            "mr-2 relative",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
          animate={{ 
            scale: isActive ? 1.1 : 1,
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
        <span className={cn(
          isActive ? "text-foreground" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </Button>
    </motion.div>
  );
}