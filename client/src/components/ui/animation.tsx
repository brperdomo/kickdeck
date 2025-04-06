import { Variants } from 'framer-motion';

// Animation types that can be used throughout the application
export const ANIMATION_TYPES = [
  'fadeIn',
  'slideLeft', 
  'slideRight',
  'slideUp',
  'slideDown',
  'scale',
  'rotate',
  'bounce',
  'pulse'
] as const;

export type AnimationType = typeof ANIMATION_TYPES[number];

// Default animation variants that can be used with framer-motion
export const ANIMATION_VARIANTS = {
  // Simple fade in animation
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  
  // Slide in from left animation
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
  
  // Slide in from right animation
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  },
  
  // Slide up animation
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  
  // Slide down animation  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
  
  // Scale animation
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
  },
  
  // Rotate animation
  rotate: {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0 },
  },
  
  // Bounce animation
  bounce: {
    initial: { opacity: 0, y: -20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
      }
    },
  },
  
  // Pulse animation
  pulse: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        yoyo: Infinity,
        ease: 'easeInOut',
      }
    },
  },
};

// Default transition configurations
export const TRANSITIONS = {
  fast: {
    duration: 0.3,
    ease: 'easeInOut',
  },
  medium: {
    duration: 0.5,
    ease: 'easeInOut',
  },
  slow: {
    duration: 0.8,
    ease: 'easeInOut',
  },
  elastic: {
    type: 'spring',
    stiffness: 300,
    damping: 15,
  },
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  },
};

// Helper function to get animation variants based on animation type
export const getAnimationVariants = (type: AnimationType): Variants => {
  // Safeguard against invalid animation types
  if (!ANIMATION_TYPES.includes(type as any)) {
    return ANIMATION_VARIANTS.fadeIn;
  }
  
  return ANIMATION_VARIANTS[type] || ANIMATION_VARIANTS.fadeIn;
};

// Helper function to create staggered children animations
export const createStaggerContainer = (staggerChildren = 0.1): Variants => {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren,
      },
    },
  };
};

// Helper function to add delay to animations
export const withDelay = (variants: Variants, delay: number): Variants => {
  if (!variants) return {};
  
  return {
    ...variants,
    animate: {
      ...(variants.animate || {}),
      transition: {
        ...(variants.animate?.transition || {}),
        delay,
      },
    },
  };
};

// Helper function to create intersection observer animation props
export const createIntersectionAnimation = (
  animation: AnimationType = 'fadeIn',
  options = { threshold: 0.1, delay: 0 }
) => {
  const variants = getAnimationVariants(animation);
  
  return {
    initial: 'initial',
    whileInView: 'animate',
    viewport: { once: true, threshold: options.threshold },
    variants: withDelay(variants, options.delay),
  };
};