import React, { useEffect, useState, useRef } from 'react';
import AuthFooter from "../../components/ui/AuthFooter";
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout component wraps auth pages with a purple-styled footer
 * Specifically designed for login, register, and forgot password pages
 * Includes a dramatic scroll animation for the footer with visual indicators
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const [showFooter, setShowFooter] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const footerControls = useAnimation();
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  
  // Check if user has scrolled enough to show the footer
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress as percentage (0-100)
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = Math.min(100, (scrollTop / (documentHeight - windowHeight)) * 100);
      
      setScrollProgress(scrollPercentage);
      
      // Show footer with smoother animation
      if (scrollTop > 10) {
        setShowFooter(true);
        footerControls.start({
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { 
            type: "tween", 
            ease: "easeOut",
            duration: 0.5
          }
        });
      } else {
        setShowFooter(false);
        footerControls.start({
          opacity: 0,
          y: 20, // Reduced from 50 to make it less jumpy
          scale: 0.95, // Less dramatic scale change
          transition: { 
            type: "tween",
            ease: "easeIn",
            duration: 0.4
          }
        });
      }
    };
    
    // Initial check on mount
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [footerControls]);

  // Scroll indicator animation
  const indicatorVariants = {
    initial: { opacity: 0, y: -10 },
    show: { 
      opacity: [0, 1, 0], 
      y: [0, 10, 20],
      transition: { 
        duration: 1.5, 
        repeat: Infinity,
        repeatType: "loop" as const
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        {children}
      </div>
      
      {/* Scroll indicator removed */}
      
      {/* Animated footer with smoother transition */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={footerControls}
        className="relative"
      >
        <AuthFooter />
      </motion.div>
      
      {/* Progress indicator that shows up at the top of the page */}
      <motion.div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#3d3a98] to-[#6A67FF] z-50"
        initial={{ width: "0%" }}
        animate={{ width: `${scrollProgress}%` }}
        transition={{ 
          ease: "easeOut", 
          duration: 0.2 
        }}
      />
    </div>
  );
}

export default AuthLayout;