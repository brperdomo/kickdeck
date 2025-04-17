import React, { useEffect, useState } from 'react';
import AuthFooter from '@/components/ui/AuthFooter';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout component wraps auth pages with a purple-styled footer
 * Specifically designed for login, register, and forgot password pages
 * Includes a scroll animation for the footer
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const [showFooter, setShowFooter] = useState(false);
  
  // Check if user has scrolled enough to show the footer
  useEffect(() => {
    const handleScroll = () => {
      // Show footer when user scrolls more than 50px
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        setShowFooter(true);
      } else {
        setShowFooter(false);
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
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        {children}
      </div>
      <AnimatePresence>
        {/* Always render the footer but animate its opacity and transform based on scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showFooter ? 1 : 0,
            y: showFooter ? 0 : 20
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative"
        >
          <AuthFooter />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default AuthLayout;