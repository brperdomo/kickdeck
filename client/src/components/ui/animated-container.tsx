import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { AnimationType, ANIMATION_VARIANTS, TRANSITIONS } from './animation';
import { cn } from '@/lib/utils';

// AnimatedContainer component for wrapping entire sections with animation
export interface AnimatedContainerProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  staggerChildren?: number;
  transition?: typeof TRANSITIONS[keyof typeof TRANSITIONS];
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  staggerChildren = 0.1,
  transition = TRANSITIONS.medium,
}) => {
  // Get the base variants from our animation library
  const variants = ANIMATION_VARIANTS[animation] || ANIMATION_VARIANTS.fadeIn;
  
  // Create container variants with staggered children animation
  const containerVariants: Variants = {
    initial: {
      ...variants.initial,
    },
    animate: {
      ...variants.animate,
      transition: {
        ...transition,
        delay,
        staggerChildren,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="initial"
      animate="animate"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
};

// AnimatedItem component for individual items within AnimatedContainer
export interface AnimatedItemProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  transition?: typeof TRANSITIONS[keyof typeof TRANSITIONS];
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  transition = TRANSITIONS.medium,
}) => {
  // Get the base variants from our animation library
  const variants = ANIMATION_VARIANTS[animation] || ANIMATION_VARIANTS.fadeIn;
  
  // Create item variants with custom transition
  const itemVariants: Variants = {
    initial: {
      ...variants.initial,
    },
    animate: {
      ...variants.animate,
      transition: {
        ...transition,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={itemVariants}
    >
      {children}
    </motion.div>
  );
};

// AnimatedList component for animating lists
export interface AnimatedListProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  staggerChildren?: number;
  transition?: typeof TRANSITIONS[keyof typeof TRANSITIONS];
  as?: 'div' | 'ul' | 'ol';
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  staggerChildren = 0.05,
  transition = TRANSITIONS.medium,
  as = 'ul',
}) => {
  // Get the base variants from our animation library
  const variants = ANIMATION_VARIANTS[animation] || ANIMATION_VARIANTS.fadeIn;
  
  // Create list variants with staggered children animation
  const listVariants: Variants = {
    initial: {
      ...variants.initial,
    },
    animate: {
      ...variants.animate,
      transition: {
        ...transition,
        delay,
        staggerChildren,
      },
    },
  };

  const Component = motion[as];

  return (
    <Component
      className={cn(className)}
      initial="initial"
      animate="animate"
      variants={listVariants}
    >
      {children}
    </Component>
  );
};

// AnimatedContent component that automatically animates when it comes into view
export interface AnimatedContentProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
  transition?: typeof TRANSITIONS[keyof typeof TRANSITIONS];
}

export const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  threshold = 0.1,
  transition = TRANSITIONS.medium,
}) => {
  // Get the base variants from our animation library
  const variants = ANIMATION_VARIANTS[animation] || ANIMATION_VARIANTS.fadeIn;
  
  // Create content variants with custom transition
  const contentVariants: Variants = {
    initial: {
      ...variants.initial,
    },
    animate: {
      ...variants.animate,
      transition: {
        ...transition,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, threshold }}
      variants={contentVariants}
    >
      {children}
    </motion.div>
  );
};