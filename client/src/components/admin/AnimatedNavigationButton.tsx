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
      className="w-full mb-1"
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
            ? 'rgba(79, 70, 229, 0.2)' // indigo with transparency 
            : 'transparent',
          color: isActive 
            ? '#ffffff' 
            : 'rgba(255, 255, 255, 0.6)',
          boxShadow: 'none',
          borderRadius: '0.5rem',
          padding: '0.625rem 1rem',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Active indicator - animated pill */}
        {isActive && (
          <motion.div 
            className="absolute left-0 top-[15%] bottom-[15%] w-1 rounded-full"
            style={{ 
              background: 'linear-gradient(to bottom, #4f46e5, #8b5cf6)'
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
        
        <div className="flex items-center">
          {/* Icon wrapper */}
          <motion.div 
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-md mr-3",
              isActive ? "bg-indigo-600 bg-opacity-30" : ""
            )}
            whileHover={{ scale: 1.05 }}
            animate={{ 
              rotate: isActive ? [0, 5, 0] : 0
            }}
            transition={{ 
              duration: 0.3,
              type: "spring"
            }}
          >
            {icon}
          </motion.div>
          
          {/* Label text */}
          <span className="text-sm">
            {label}
          </span>
        </div>
      </Button>
    </motion.div>
  );
}