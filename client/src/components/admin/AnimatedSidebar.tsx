import { motion } from "framer-motion";
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedContent, AnimatedItem, ANIMATION_CONFIG } from "@/components/ui/animation";

interface AnimatedSidebarProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

const sidebarVariants = {
  hidden: { 
    opacity: 0,
    x: -40 
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: { 
      duration: 0.5,
      type: "spring",
      stiffness: 100,
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    x: -40,
    transition: { 
      duration: 0.3 
    }
  }
};

export function AnimatedSidebar({ 
  children, 
  title = "Dashboard", 
  icon, 
  className 
}: AnimatedSidebarProps) {
  return (
    <motion.div
      className={cn(
        "w-64 flex flex-col h-full text-white",
        className
      )}
      style={{ 
        background: "#0B0F1E",  // Deep navy background like the reference design
        borderRight: "1px solid rgba(255,255,255,0.1)" 
      }}
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Stylish sidebar header */}
      {title && (
        <motion.div 
          className="p-6 border-b border-opacity-10 border-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <motion.div
                className="p-2 rounded-md bg-indigo-600 bg-opacity-30"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {icon}
              </motion.div>
            )}
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-xs text-gray-400 mt-1">Management Portal</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Content wrapper */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// AnimatedContent is now imported from @/components/ui/animation
// This component has been removed to avoid duplication