import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export function AuthFooter() {
  const currentYear = new Date().getFullYear();
  
  // Enhanced animation variants for more dramatic staggered text animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.1
      }
    }
  };
  
  // More dramatic animations for the text items
  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  // Logo animation with bounce effect
  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    show: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    },
    hover: { 
      scale: 1.1,
      color: "#6A67FF",
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 10 
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
            <Link href="https://matchpro.ai" className="font-bold text-[#3d3a98] hover:text-[#6A67FF] transition-colors">
              MatchPro
            </Link>
          </motion.span>
        </motion.p>
        <motion.p variants={itemVariants} className="text-[#3d3a98] font-medium">
          &copy; {currentYear} MatchPro. All rights reserved.
        </motion.p>
      </motion.div>
    </footer>
  );
}

export default AuthFooter;