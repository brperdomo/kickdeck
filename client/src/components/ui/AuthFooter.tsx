import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export function AuthFooter() {
  const currentYear = new Date().getFullYear();
  
  // Animation variants for staggered text animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 }}
  };
  
  return (
    <footer className="py-4 px-6 text-center text-sm border-0 mt-auto relative z-10 bg-white/5 backdrop-blur-sm">
      <motion.div 
        className="container mx-auto flex flex-col items-center justify-center gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.p variants={itemVariants} className="text-[#3d3a98] font-medium">
          Powered by <Link href="https://matchpro.ai" className="font-semibold text-[#3d3a98] hover:text-[#2d2a88]">MatchPro</Link>
        </motion.p>
        <motion.p variants={itemVariants} className="text-[#3d3a98] font-medium">
          &copy; {currentYear} MatchPro. All rights reserved.
        </motion.p>
      </motion.div>
    </footer>
  );
}

export default AuthFooter;