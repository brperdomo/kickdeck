import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

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

const sidebarVariants = {
  hidden: { 
    opacity: 0,
    x: -40 
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: { 
      duration: 0.6,
      type: "spring",
      stiffness: 80,
      damping: 15,
      when: "beforeChildren",
      staggerChildren: 0.07
    }
  }
};

const navItemVariants = {
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
  })
};

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeItem?: string;
  onNavItemClick?: (itemId: string) => void;
  navItems?: NavItem[];
  icon?: React.ReactNode;
  backUrl?: string;
  backLabel?: string;
}

export function AdminPageLayout({ 
  children, 
  title,
  subtitle = "Management Console",
  activeItem,
  onNavItemClick,
  navItems = [],
  icon = <Calendar className="h-5 w-5 text-indigo-300" />,
  backUrl = "/admin",
  backLabel = "Back to Dashboard"
}: AdminPageLayoutProps) {
  const [, navigate] = useLocation();
  const [gradientOffset, setGradientOffset] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientOffset(prev => (prev + 1) % 100);
    }, 30000); // Subtle movement every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Animated Sidebar */}
      <motion.div
        className="w-64 flex flex-col h-full text-white relative"
        style={{ 
          background: `linear-gradient(180deg, rgba(9, 9, 26, 0.97) ${gradientOffset}%, rgba(16, 15, 41, 0.98) ${50 + gradientOffset}%, rgba(26, 24, 64, 0.95) 100%)`,
          borderRight: "1px solid rgba(78, 75, 128, 0.3)",
          boxShadow: "0 0 30px rgba(0, 0, 0, 0.5) inset"
        }}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background subtle animated particles */}
        <Particles />
        
        {/* Glowing edges */}
        <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 pointer-events-none" />
        
        {/* Enhanced stylish sidebar header with animation */}
        <motion.div 
          className="px-6 py-7 border-b border-gray-800/50 relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {icon}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h1 className="font-semibold text-white relative">
                <span className="relative">
                  {title}
                  <motion.span 
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </h1>
              <motion.p 
                className="text-xs text-indigo-300/70 mt-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {subtitle}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Enhanced content wrapper with decorative elements */}
        {navItems.length > 0 && (
          <div className="relative flex-1 overflow-y-auto">
            {/* Multiple decorative sidebar elements for enhanced visual depth */}
            <div className="absolute top-10 right-0 w-full h-40 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-10 w-20 h-20 bg-purple-600/5 blur-[70px] rounded-full pointer-events-none" />
            <div className="absolute bottom-20 right-0 w-full h-40 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />
            
            {/* Content with improved spacing */}
            <div className="p-5 pt-6">
              <div className="space-y-2.5 relative">
                {/* Navigation Buttons */}
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    custom={index}
                    variants={navItemVariants}
                    whileHover={{ x: 6 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onNavItemClick && onNavItemClick(item.id)}
                    className={cn(
                      "relative px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150",
                      "flex items-center",
                      activeItem === item.id
                        ? "bg-white/10 text-white"
                        : "text-indigo-100/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {activeItem === item.id && (
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-400 rounded-full"
                        layoutId="activeTab"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <span className="text-sm">{item.icon}</span>
                        ) : (
                          <span className="text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          </span>
                        )}
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      
                      {activeItem === item.id && (
                        <motion.div
                          className="h-2 w-2 rounded-full bg-indigo-400"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 10 
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer section */}
        <motion.div 
          className="mt-auto p-5 pt-4 border-t border-gray-800/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Button 
            variant="outline" 
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/30"
            onClick={() => navigate(backUrl)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </motion.div>
      </motion.div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}