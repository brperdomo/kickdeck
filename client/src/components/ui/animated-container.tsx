import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedContainer({
  children,
  className,
  delay = 0,
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        delay: delay,
      }}
      className={cn(
        "bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function FadeInList({ children }: { children: React.ReactNode[] }) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: i * 0.05, // stagger the animations
          }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}

export function StaggeredList({ 
  children,
  as = "div" 
}: { 
  children: React.ReactNode[];
  as?: React.ElementType;
}) {
  const MotionComponent = motion.div;
  
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <MotionComponent
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.2,
            delay: i * 0.05,
          }}
        >
          {child}
        </MotionComponent>
      ))}
    </>
  );
}

// For page transitions
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
};

export const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}