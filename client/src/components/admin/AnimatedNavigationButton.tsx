import React, { useState, useEffect, useRef } from "react";
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

// Enhanced animation variants — neon theme (Phase 2: dramatic overhaul)
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
      delay: 0.1 + (index * 0.05),
      duration: 0.5,
      type: "spring",
      stiffness: 180,
      damping: 12
    }
  }),
  hover: {
    x: 8,
    transition: {
      duration: 0.25,
      type: "spring",
      stiffness: 500,
      damping: 12
    }
  },
  tap: {
    scale: 0.92,
    transition: {
      duration: 0.06
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

// Wrapper component that previously handled permission checks
function NavigationButtonWrapper(props: AnimatedNavigationButtonProps) {
  const { hasPermission } = usePermissions();

  // Always render the button regardless of permissions
  return <NavigationButtonContent {...props} />;
}

// Actual button component
function NavigationButtonContent({
  view,
  activeView,
  onClick,
  icon,
  label,
  index = 0
}: AnimatedNavigationButtonProps) {
  const [hasShined, setHasShined] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActive = activeView === view;

  const [animationState, setAnimationState] = useState("initial");

  useEffect(() => {
    if (animationState === "completed") {
      setAnimationState("initial");
      setHasShined(true);
    }
  }, [animationState]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isActive) {
      const timer = setTimeout(() => {
        setAnimationState("animate");
      }, 100);

      if (hasShined) {
        intervalRef.current = setInterval(() => {
          setAnimationState("animate");
        }, 8000);
      }

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, hasShined]);

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
        style={{
          backgroundColor: isActive
            ? 'rgba(124, 58, 237, 0.15)'
            : 'transparent',
          color: isActive
            ? '#ffffff'
            : 'rgba(255, 255, 255, 0.7)',
          boxShadow: isActive ? '0 0 20px rgba(124, 58, 237, 0.2)' : 'none',
          borderRadius: '0.375rem',
          padding: '0.5rem 0.75rem',
          height: 'auto',
          minHeight: '2.25rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.12)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(124, 58, 237, 0.2), inset 0 0 15px rgba(124, 58, 237, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
        onClick={(e) => {
          // Trigger neon flash animation on click
          const el = e.currentTarget;
          el.classList.add('neon-click-flash');
          setTimeout(() => el.classList.remove('neon-click-flash'), 400);
          onClick();
        }}
      >
        {/* Active indicator elements */}
        <div className={isActive ? "block" : "hidden"}>
          {/* Main indicator bar — violet gradient */}
          <motion.div
            className="absolute left-0 top-[15%] bottom-[15%] w-1.5 rounded-full shadow-lg shadow-violet-500/40"
            style={{
              background: 'linear-gradient(to bottom, #7c3aed, #a855f7)'
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Glowing dot at the top of the indicator */}
          <motion.div
            className="absolute left-0 top-[12%] w-3 h-3 rounded-full shadow-lg shadow-violet-500/50 -translate-x-1"
            initial="initial"
            animate="pulse"
            variants={pulseVariants}
            style={{
              filter: "blur(1px)",
              background: "radial-gradient(circle, rgba(167,139,250,1) 0%, rgba(124,58,237,1) 100%)"
            }}
          />

          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-violet-600/0 via-violet-600/30 to-violet-600/0 rounded-md" />

          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"
            variants={shineVariants}
            initial="initial"
            animate={animationState}
            onAnimationComplete={() => {
              if (animationState === "animate") {
                setAnimationState("completed");
              }
            }}
          />
        </div>

        {/* Button content */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {/* Enhanced icon wrapper — neon violet/cyan */}
            <motion.div
              className={cn(
                "w-6 h-6 flex items-center justify-center rounded-md mr-3 relative",
                isActive
                  ? "bg-gradient-to-br from-violet-600/90 to-purple-800/90 shadow-lg shadow-violet-900/20"
                  : "bg-gray-800/70 border border-gray-700/50"
              )}
              whileHover={{
                scale: 1.18,
                rotate: 12,
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.4), 0 0 30px rgba(124, 58, 237, 0.2)'
              }}
              animate={{
                rotate: isActive ? [0, 6, 0] : 0
              }}
              transition={{
                duration: 0.35,
                type: "spring",
                stiffness: 300,
                damping: 10
              }}
            >
              {/* Background glow for active icon */}
              <div className={isActive ? "absolute inset-0 rounded-md bg-violet-500/20 filter blur-sm" : "hidden"} />

              {/* Icon */}
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                className="z-10 flex items-center justify-center w-full h-full"
              >
                {icon}
              </motion.div>
            </motion.div>

            {/* Label text */}
            <div className="flex flex-col">
              <motion.span
                className={cn(
                  "text-sm transition-all duration-200",
                  isActive
                    ? "text-white font-medium tracking-wide"
                    : "text-gray-400 group-hover:text-gray-200"
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
                <motion.div
                  className={`h-[1px] mt-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/60 to-violet-500/0 ${isActive ? 'block' : 'hidden'}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                />
              </motion.span>

              {/* Optional micro-label */}
              <motion.span
                className={`text-[10px] text-violet-300/70 mt-0.5 tracking-wider ${isActive ? '' : 'hidden'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {/* Uncomment to add a micro-label */}
                {/* ACTIVE */}
              </motion.span>
            </div>
          </div>

          {/* Chevron indicator for active state */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.5,
              x: isActive ? 0 : -10
            }}
            transition={{ duration: 0.3, type: "spring" }}
            className={`h-5 w-5 rounded-full bg-violet-600/40 flex items-center justify-center ${isActive ? 'block' : 'hidden'}`}
          >
            <ChevronRight className="h-3 w-3 text-violet-200 flex-shrink-0" />
          </motion.div>
        </div>
      </Button>
    </motion.div>
  );
}

// Export the wrapped component as the main component
export const AnimatedNavigationButton = NavigationButtonWrapper;
