import { motion } from "framer-motion";
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        "w-64 bg-card border-r flex flex-col h-full text-foreground",
        className
      )}
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="p-4 flex flex-col h-full">
        {/* Sidebar Header */}
        {title && (
          <motion.div 
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {icon && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {icon}
              </motion.div>
            )}
            <h1 className="font-semibold text-xl">{title}</h1>
          </motion.div>
        )}
        
        {/* Content wrapper */}
        <div className="space-y-2">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface AnimatedContentProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedContent({ 
  children, 
  className 
}: AnimatedContentProps) {
  return (
    <motion.div
      className={cn("flex-1 overflow-auto", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {children}
    </motion.div>
  );
}