import React, { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  animation?: "fadeIn" | "slideUp" | "slideRight" | "scale" | "none";
  once?: boolean;
}

// Animation variants for different animation types
const variants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: (delay = 0) => ({
      opacity: 1,
      transition: { 
        delay, 
        duration: 0.5 
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
        duration: 0.5,
        type: "spring",
        stiffness: 100
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
        duration: 0.5,
        type: "spring",
        stiffness: 100
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
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }
    })
  },
  none: {
    hidden: {},
    visible: {}
  }
};

/**
 * AnimatedContainer - A wrapper component that adds animations to its children
 * 
 * @example
 * <AnimatedContainer animation="fadeIn" delay={0.2}>
 *   <p>This content will fade in with a 0.2 second delay</p>
 * </AnimatedContainer>
 */
export function AnimatedContainer({
  children,
  className,
  delay = 0,
  duration = 0.5,
  animation = "fadeIn",
  once = true
}: AnimatedContainerProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      custom={delay}
      variants={variants[animation]}
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
export function AnimatedItem({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { 
            delay: 0.05 * index,
            duration: 0.4,
            type: "spring",
            stiffness: 100
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
export function AnimatedList({
  children,
  className,
  staggerDelay = 0.05,
  duration = 0.4
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
}) {
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