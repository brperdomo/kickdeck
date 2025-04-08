import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface AnimatedNavigationButtonProps {
  view: string;
  activeView: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  permission?: string;
  index?: number;
}

// Enhanced animation variants for more sophisticated animations
const buttonVariants = {
  hidden: { 
    opacity: 0,
    x: -20,
    filter: "blur(8px)"
  },
  visible: (index = 0) => ({ 
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { 
      delay: 0.2 + (index * 0.08),
      duration: 0.6,
      type: "spring", 
      stiffness: 120,
      damping: 15
    }
  }),
  hover: { 
    x: 6,
    transition: { 
      duration: 0.4,
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  },
  tap: { 
    scale: 0.96,
    transition: { 
      duration: 0.1 
    }
  }
};

// Subtle shine effect that plays periodically on active buttons
const shineVariants = {
  initial: {
    x: "-120%",
    opacity: 0.05,
    skewX: "-20deg"
  },
  animate: {
    x: "120%",
    opacity: 0.15,
    skewX: "-20deg",
    transition: {
      duration: 1.8,
      ease: "easeInOut"
    }
  }
};

// Pulse animation for the active indicator dot
const pulseVariants = {
  initial: {
    scale: 1,
    opacity: 0.8
  },
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const
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
  const shineControls = useAnimation();
  const [hasShined, setHasShined] = useState(false);
  
  // If user doesn't have permission, don't render the button
  if (permission && !hasPermission(permission as any)) {
    return null;
  }

  const isActive = activeView === view;
  
  // Start the shine effect when button becomes active
  useEffect(() => {
    if (isActive) {
      // Immediately shine for the first time
      shineControls.start("animate").then(() => {
        shineControls.set("initial");
        setHasShined(true);
      });
      
      // Periodically shine the button every 8 seconds
      let interval: ReturnType<typeof setInterval>;
      if (hasShined) {
        interval = setInterval(() => {
          shineControls.set("initial");
          shineControls.start("animate");
        }, 8000);
      }
      
      return () => interval && clearInterval(interval);
    }
  }, [isActive, shineControls, hasShined]);

  return (
    <motion.div
      custom={index}
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      className="w-full mb-2"
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
            ? 'rgba(79, 70, 229, 0.15)' // subtle indigo background
            : 'transparent',
          color: isActive 
            ? '#ffffff' 
            : 'rgba(255, 255, 255, 0.7)',
          boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.15)' : 'none',
          borderRadius: '0.375rem',
          padding: '0.75rem 0.875rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Enhanced active indicator with gradient, glow and pulse effect */}
        {isActive && (
          <>
            {/* Main indicator bar with gradient */}
            <motion.div 
              className="absolute left-0 top-[15%] bottom-[15%] w-1.5 rounded-full shadow-lg shadow-indigo-500/40"
              style={{ 
                background: 'linear-gradient(to bottom, #4f46e5, #a78bfa)'
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
            
            {/* Glowing dot at the top of the indicator */}
            <motion.div 
              className="absolute left-0 top-[12%] w-3 h-3 rounded-full bg-indigo-400 shadow-lg shadow-indigo-500/50 -translate-x-1"
              initial="initial"
              animate="pulse"
              variants={pulseVariants}
              style={{
                filter: "blur(1px)",
                background: "radial-gradient(circle, rgba(129,140,248,1) 0%, rgba(99,102,241,1) 100%)"
              }}
            />
          </>
        )}
        
        {/* Subtle background glow for active button */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-indigo-600/0 via-indigo-600/30 to-indigo-600/0 rounded-md" />
        )}
        
        {/* Animated shine effect */}
        {isActive && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"
            variants={shineVariants}
            initial="initial"
            animate={shineControls}
          />
        )}
        
        {/* Button content */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {/* Enhanced icon wrapper */}
            <motion.div 
              className={cn(
                "min-w-8 h-8 flex items-center justify-center rounded-md mr-3 relative",
                isActive 
                  ? "bg-gradient-to-br from-indigo-600/90 to-indigo-800/90 shadow-lg shadow-indigo-900/20" 
                  : "bg-gray-800/70 border border-gray-700/50"
              )}
              whileHover={{ scale: 1.08 }}
              animate={{ 
                rotate: isActive ? [0, 6, 0] : 0
              }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                damping: 10
              }}
            >
              {/* Subtle background glow for active icon */}
              {isActive && (
                <div className="absolute inset-0 rounded-md bg-indigo-500/20 filter blur-sm" />
              )}
              
              {/* Icon */}
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                className="z-10"
              >
                {icon}
              </motion.div>
            </motion.div>
            
            {/* Label text with sophisticated styling */}
            <div className="flex flex-col">
              <motion.span 
                className={cn(
                  "text-sm transition-all duration-200",
                  isActive 
                    ? "text-white font-medium tracking-wide" 
                    : "text-gray-400 group-hover:text-gray-300"
                )}
                animate={{
                  y: isActive ? [2, 0] : 0,
                  opacity: isActive ? [0.5, 1] : 1
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
              >
                {label}
                
                {/* Subtle underline for active state */}
                {isActive && (
                  <motion.div 
                    className="h-[2px] mt-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/60 to-indigo-500/0"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  />
                )}
              </motion.span>
              
              {/* Optional micro-label that could show additional info */}
              {isActive && (
                <motion.span 
                  className="text-[10px] text-indigo-300/70 mt-0.5 tracking-wider hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  {/* Uncomment to add a micro-label */}
                  {/* ACTIVE */}
                </motion.span>
              )}
            </div>
          </div>
          
          {/* Chevron indicator for active state */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="h-5 w-5 rounded-full bg-indigo-600/40 flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3 text-indigo-200" />
            </motion.div>
          )}
        </div>
      </Button>
    </motion.div>
  );
}