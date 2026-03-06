import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export function AuthFooter() {
  const currentYear = new Date().getFullYear();
  
  // Smoother animation variants with less dramatic staggering
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Reduced from 0.3
        delayChildren: 0.05    // Reduced from 0.1
      }
    }
  };
  
  // Smoother, more subtle animations for the text items
  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 }, // Reduced scale and y values
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5,
        type: "tween",
        ease: "easeOut"
      }
    }
  };
  
  // Smoother logo animation with less bounce
  const logoVariants = {
    hidden: { scale: 0.95, opacity: 0 }, // Less dramatic scale change
    show: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "tween",
        ease: "easeOut",
        duration: 0.4
      }
    },
    hover: { 
      scale: 1.05, // Reduced from 1.1
      color: "#6A67FF",
      transition: { 
        type: "tween", 
        ease: "easeInOut",
        duration: 0.3
      }
    }
  };
  
  return (
    <footer className="py-5 px-8 text-center text-sm border-t border-[#3d3a98]/20 mt-auto relative z-10 bg-white/10 backdrop-blur-md shadow-lg">
      <motion.div 
        className="container mx-auto flex flex-col items-center justify-center gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.p variants={itemVariants} className="text-[#3d3a98] font-medium text-base">
          Powered by{" "}
          <motion.span
            variants={logoVariants}
            whileHover="hover"
            className="inline-block"
          >
            <Link href="https://kickdeck.io" className="font-bold text-[#3d3a98] hover:text-[#6A67FF] transition-colors">
              KickDeck
            </Link>
          </motion.span>
        </motion.p>
        <motion.p variants={itemVariants} className="text-[#3d3a98] font-medium">
          &copy; {currentYear} KickDeck. All rights reserved.
        </motion.p>
      </motion.div>
    </footer>
  );
}

export default AuthFooter;