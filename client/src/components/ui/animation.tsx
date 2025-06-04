import React, { ReactNode } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "../../lib/utils";

// ===========================
// Animation Configuration
// ===========================

/**
 * Central animation configuration for consistent animations across components
 */
export const ANIMATION_CONFIG = {
  // Durations
  duration: {
    fast: 0.2,
    normal: 0.4,
    slow: 0.5,
  },
  
  // Delays
  delay: {
    none: 0,
    short: 0.1,
    medium: 0.2,
    long: 0.3,
  },
  
  // Stagger delays for lists
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.08,
  },
  
  // Spring configs
  spring: {
    default: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
    bouncy: {
      type: "spring" as const,
      stiffness: 200,
      damping: 10,
    },
    gentle: {
      type: "spring" as const,
      stiffness: 50,
      damping: 20,
    }
  },
  
  // Ease functions
  ease: {
    default: "easeOut" as const,
    in: "easeIn" as const,
    inOut: "easeInOut" as const,
  }
};

// ===========================
// Animation Variants
// ===========================

/**
 * Standard animation variants that can be reused across components
 */
export const ANIMATION_VARIANTS: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: (delay = 0) => ({
      opacity: 1,
      transition: { 
        delay, 
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.default
      }
    })
  },
  
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay, 
        duration: ANIMATION_CONFIG.duration.normal,
        ...ANIMATION_CONFIG.spring.default
      }
    })
  },
  
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      transition: { 
        delay, 
        duration: ANIMATION_CONFIG.duration.normal,
        ...ANIMATION_CONFIG.spring.default
      }
    })
  },
  
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      transition: { 
        delay, 
        duration: ANIMATION_CONFIG.duration.normal,
        ...ANIMATION_CONFIG.spring.default
      }
    })
  },
  
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (delay = 0) => ({
      opacity: 1,
      scale: 1,
      transition: { 
        delay, 
        duration: ANIMATION_CONFIG.duration.normal,
        ...ANIMATION_CONFIG.spring.default
      }
    })
  },
  
  none: {
    hidden: {},
    visible: {}
  }
};

// ===========================
// Animation Components
// ===========================

/**
 * AnimatedContainer - A wrapper component that adds animations to its children
 * 
 * @example
 * <AnimatedContainer animation="fadeIn" delay={ANIMATION_CONFIG.delay.medium}>
 *   <p>This content will fade in with a medium delay</p>
 * </AnimatedContainer>
 */
export interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  animation?: keyof typeof ANIMATION_VARIANTS;
  once?: boolean;
  custom?: any;
}

export function AnimatedContainer({
  children,
  className,
  delay = ANIMATION_CONFIG.delay.none,
  duration = ANIMATION_CONFIG.duration.normal,
  animation = "fadeIn",
  once = true,
  custom,
}: AnimatedContainerProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      custom={custom || delay}
      variants={ANIMATION_VARIANTS[animation]}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedContent - Main content container with standardized animations
 * 
 * @example
 * <AnimatedContent animation="slideLeft">
 *   <div>My page content</div>
 * </AnimatedContent>
 */
export interface AnimatedContentProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: keyof typeof ANIMATION_VARIANTS | "custom";
  customAnimation?: {
    initial: any;
    animate: any;
  };
}

export function AnimatedContent({ 
  children, 
  className = "flex-1 overflow-auto",
  delay = ANIMATION_CONFIG.delay.medium,
  animation = "slideLeft",
  customAnimation
}: AnimatedContentProps) {
  // Default animation configurations
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 }
    }
  };
  
  // Determine which animation to use
  const { initial, animate } = animation === "custom" && customAnimation 
    ? customAnimation 
    : animations[animation] || animations.fadeIn;
  
  return (
    <motion.div
      className={cn(className)}
      initial={initial}
      animate={animate}
      transition={{
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.default,
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedItem - A component for list items that stagger their appearance
 * 
 * @example
 * <div>
 *   {items.map((item, index) => (
 *     <AnimatedItem key={item.id} index={index}>
 *       <div>{item.name}</div>
 *     </AnimatedItem>
 *   ))}
 * </div>
 */
export interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
  staggerDelay?: number;
}

export function AnimatedItem({
  children,
  className,
  index = 0,
  staggerDelay = ANIMATION_CONFIG.stagger.normal
}: AnimatedItemProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { 
            delay: staggerDelay * index,
            duration: ANIMATION_CONFIG.duration.normal,
            ...ANIMATION_CONFIG.spring.default
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedList - A wrapper for lists where children should animate in a staggered sequence
 * 
 * @example
 * <AnimatedList>
 *   {items.map((item) => (
 *     <li key={item.id}>{item.name}</li>
 *   ))}
 * </AnimatedList>
 */
export interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
}

export function AnimatedList({
  children,
  className,
  staggerDelay = ANIMATION_CONFIG.stagger.normal,
  duration = ANIMATION_CONFIG.duration.normal
}: AnimatedListProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: {
          opacity: 1,
          transition: {
            when: "beforeChildren",
            staggerChildren: staggerDelay,
          },
        },
        hidden: {
          opacity: 0,
          transition: {
            when: "afterChildren",
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        return (
          <motion.div
            variants={{
              visible: { 
                opacity: 1, 
                y: 0, 
                transition: { duration } 
              },
              hidden: { 
                opacity: 0, 
                y: 20, 
                transition: { duration } 
              },
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/**
 * AnimatedPresenceWrapper - A component for smooth transitions between screens/routes
 * 
 * @example
 * <AnimatedPresenceWrapper>
 *   <div key={currentPage}>Your page content</div>
 * </AnimatedPresenceWrapper>
 */
export interface AnimatedPresenceWrapperProps {
  children: ReactNode;
  mode?: "wait" | "sync" | "popLayout";
}

export function AnimatedPresenceWrapper({
  children,
  mode = "wait"
}: AnimatedPresenceWrapperProps) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
}

/**
 * AnimatedTabContent - A component specifically designed for tab content transitions
 * 
 * @example
 * <AnimatedTabContent key={selectedTab}>
 *   Tab content for {selectedTab}
 * </AnimatedTabContent>
 */
export interface AnimatedTabContentProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedTabContent({ 
  children,
  className
}: AnimatedTabContentProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ 
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.inOut
      }}
    >
      {children}
    </motion.div>
  );
}