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

// Subtle particle animation for sidebar background — neon violet/cyan mix
const Particles = () => {
  const colors = [
    'bg-violet-500/25',
    'bg-violet-400/20',
    'bg-cyan-500/15',
    'bg-purple-500/20',
    'bg-violet-300/15',
    'bg-cyan-400/12',
    'bg-violet-600/18',
    'bg-purple-400/15',
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${colors[i % colors.length]}`}
          initial={{
            x: Math.random() * 100 + 50,
            y: Math.random() * 300 + 100,
            opacity: 0.1 + Math.random() * 0.25
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
      <div className="absolute top-0 left-0 right-0 h-20 bg-violet-600/5 blur-xl rounded-full pointer-events-none"></div>

      <div className="flex items-center gap-3 relative">
        {icon && (
          <motion.div
            className="p-2.5 rounded-md bg-gradient-to-br from-violet-900/80 to-purple-800/80 shadow-lg shadow-violet-900/30 border border-violet-700/30"
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
              {/* Text with neon gradient */}
              <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-violet-300 bg-clip-text text-transparent">
                {title}
              </span>

              {/* Subtle highlight under text */}
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              ></motion.span>
            </span>
          </h1>
          <motion.p
            className="text-xs text-violet-300/70 mt-1.5"
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
    background: `linear-gradient(180deg, rgba(9, 9, 26, 0.98) ${gradientOffset}%, rgba(16, 12, 42, 0.98) ${50 + gradientOffset}%, rgba(20, 16, 52, 0.96) 100%)`,
    borderRight: "1px solid rgba(124, 58, 237, 0.15)",
    boxShadow: "0 0 30px rgba(0, 0, 0, 0.5) inset, 0 0 15px rgba(124, 58, 237, 0.05)",
    zIndex: 40,
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

      {/* Neon edge glow - violet to cyan gradient */}
      <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-violet-500/0 via-cyan-500/25 to-violet-500/0 pointer-events-none" />

      {/* Enhanced content wrapper with decorative elements */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Decorative neon ambient glow elements */}
        <div className="absolute top-10 right-0 w-full h-40 bg-violet-600/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-cyan-600/4 blur-[70px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-20 right-0 w-full h-40 bg-purple-600/5 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Compact content container */}
        <div className="p-2 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col space-y-0.5 relative">
            {children}
          </div>
        </div>
      </div>
    </CollapsibleSidebar>
  );
}
