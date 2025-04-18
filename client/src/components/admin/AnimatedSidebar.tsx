import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedContent, AnimatedItem, ANIMATION_CONFIG } from "@/components/ui/animation";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";

interface AnimatedSidebarProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

// Subtle particle animation for sidebar background
const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-500/20"
          initial={{ 
            x: Math.random() * 100 + 50, 
            y: Math.random() * 300 + 100,
            opacity: 0.1 + Math.random() * 0.2
          }}
          animate={{ 
            y: [null, Math.random() * 400 + 100],
            opacity: [null, 0]
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ 
            filter: `blur(${Math.random() * 2}px)`,
            scale: 0.5 + Math.random() * 1.5
          }}
        />
      ))}
    </div>
  );
};

export function AnimatedSidebar({ 
  children, 
  title = "Dashboard", 
  icon, 
  className 
}: AnimatedSidebarProps) {
  // Extra visual effect - time-based gradient shift
  const [gradientOffset, setGradientOffset] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientOffset(prev => (prev + 1) % 100);
    }, 30000); // Subtle movement every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Animated sidebar header content for collapsible sidebar
  const sidebarHeader = (
    <div className="relative">
      {/* Header backdrop glow */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-indigo-600/5 blur-xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-3 relative">
        {icon && (
          <motion.div
            className="p-2.5 rounded-md bg-gradient-to-br from-indigo-900/80 to-indigo-800/80 shadow-lg shadow-indigo-900/30 border border-indigo-700/30"
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ 
              delay: 0.4, 
              type: "spring",
              stiffness: 200 
            }}
          >
            {icon}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <h1 className="font-bold text-xl tracking-tight">
            <span className="relative">
              {/* Text with fancy gradient */}
              <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                {title}
              </span>
              
              {/* Subtle highlight under text */}
              <motion.span 
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              ></motion.span>
            </span>
          </h1>
          <motion.p 
            className="text-xs text-indigo-300/70 mt-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Management Portal
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
  
  const sidebarStyles = {
    background: `linear-gradient(180deg, rgba(9, 9, 26, 0.97) ${gradientOffset}%, rgba(16, 15, 41, 0.98) ${50 + gradientOffset}%, rgba(26, 24, 64, 0.95) 100%)`,
    borderRight: "1px solid rgba(78, 75, 128, 0.3)",
    boxShadow: "0 0 30px rgba(0, 0, 0, 0.5) inset",
    zIndex: 40, // Ensure sidebar stays above other elements
  };

  return (
    <CollapsibleSidebar
      headerContent={sidebarHeader}
      className={cn("text-white", className)}
      sidebarStyles={sidebarStyles}
      collapseBreakpoint="md"
      width="w-64"
      showToggleOnDesktop={true}
      togglePosition="right"
    >
      {/* Background subtle animated particles */}
      <Particles />
      
      {/* Glowing edges */}
      <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 pointer-events-none" />
      
      {/* Enhanced content wrapper with decorative elements */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Multiple decorative sidebar elements for enhanced visual depth */}
        <div className="absolute top-10 right-0 w-full h-40 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-purple-600/5 blur-[70px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-20 right-0 w-full h-40 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        {/* Compact content container */}
        <div className="p-3 pt-4 flex-1 flex flex-col">
          <div className="space-y-1 relative">
            {children}
          </div>
        </div>
      </div>
    </CollapsibleSidebar>
  );
}