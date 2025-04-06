import React from 'react';
import { motion } from 'framer-motion';

type MotionLogoProps = {
  size?: 'sm' | 'md' | 'lg' | number;
  showText?: boolean;
  className?: string;
  animated?: boolean;
};

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
};

const MotionLogo: React.FC<MotionLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  animated = true,
}) => {
  const primaryColor = 'hsl(var(--primary))';
  const secondaryColor = 'hsl(var(--muted-foreground))';
  
  const logoSize = typeof size === 'number' ? size : sizes[size];
  
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const pathVariants = {
    initial: {
      opacity: 0,
      pathLength: 0,
    },
    animate: {
      opacity: 1,
      pathLength: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };
  
  const textVariants = {
    initial: {
      opacity: 0,
      y: 5,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.8,
      },
    },
  };
  
  const pulseVariants = {
    initial: {
      scale: 1,
    },
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        variants={animated ? containerVariants : {}}
        initial={animated ? "initial" : false}
        animate={animated ? "animate" : false}
        whileHover={animated ? { scale: 1.05 } : {}}
      >
        <motion.svg
          width={logoSize}
          height={logoSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          variants={animated ? pulseVariants : {}}
        >
          {/* Soccer ball shape */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="white"
            stroke={primaryColor}
            strokeWidth="3"
            variants={animated ? pathVariants : {}}
          />
          
          {/* Soccer ball pattern */}
          <motion.path
            d="M32 4C24.5739 4 17.452 7.0018 12.2513 12.2513C7.0018 17.452 4 24.5739 4 32C4 39.4261 7.0018 46.548 12.2513 51.7487C17.452 56.9982 24.5739 60 32 60"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            variants={animated ? pathVariants : {}}
          />
          
          <motion.path
            d="M20 16L44 48"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            variants={animated ? pathVariants : {}}
          />
          
          <motion.path
            d="M44 16L20 48"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            variants={animated ? pathVariants : {}}
          />
          
          <motion.path
            d="M32 4V16"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            variants={animated ? pathVariants : {}}
          />
          
          <motion.path
            d="M32 48V60"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            variants={animated ? pathVariants : {}}
          />
          
          <motion.path
            d="M60 32H48"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            variants={animated ? pathVariants : {}}
          />
          
          <motion.path
            d="M16 32H4"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            variants={animated ? pathVariants : {}}
          />
        </motion.svg>
      </motion.div>
      
      {showText && (
        <motion.div
          className="font-semibold text-foreground"
          style={{ fontSize: logoSize * 0.5 }}
          variants={animated ? textVariants : {}}
          initial={animated ? "initial" : false}
          animate={animated ? "animate" : false}
        >
          MatchPro
        </motion.div>
      )}
    </div>
  );
};

export default MotionLogo;