import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimationType, ANIMATION_VARIANTS } from './animation';

interface MotionCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  animationType?: AnimationType;
  animationDelay?: number;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  onClick?: () => void;
  interactive?: boolean;
  elevated?: boolean;
}

const MotionCard: React.FC<MotionCardProps> = ({
  children,
  title,
  description,
  footer,
  animationType = 'fadeIn',
  animationDelay = 0,
  className = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  onClick,
  interactive = false,
  elevated = false,
}) => {
  // Get the animation variants from the animation utility
  const variants = ANIMATION_VARIANTS[animationType] || ANIMATION_VARIANTS.fadeIn;
  
  // Additional variants for the interactive cards
  const hoverVariants: Variants = interactive ? {
    hover: {
      y: -5,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: { duration: 0.2 }
    }
  } : {};
  
  // Card elevation classes
  const elevationClass = elevated 
    ? 'shadow-lg hover:shadow-xl' 
    : 'shadow-sm hover:shadow-md';
    
  // Card interactive classes
  const interactiveClass = interactive 
    ? 'cursor-pointer transition-all' 
    : '';

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover={interactive ? "hover" : undefined}
      variants={{
        ...variants,
        ...hoverVariants
      }}
      transition={{ delay: animationDelay }}
      className={cn('relative', interactiveClass)}
      onClick={onClick}
    >
      <Card className={cn(
        'h-full border overflow-hidden',
        elevationClass,
        className
      )}>
        {/* Animated gradient accent at the top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        
        {(title || description) && (
          <CardHeader className={cn(headerClassName)}>
            {title && (typeof title === 'string' 
              ? <CardTitle>{title}</CardTitle>
              : title
            )}
            {description && (typeof description === 'string'
              ? <CardDescription>{description}</CardDescription>
              : description
            )}
          </CardHeader>
        )}
        
        <CardContent className={cn('flex flex-col flex-grow', contentClassName)}>
          {children}
        </CardContent>
        
        {footer && (
          <CardFooter className={cn(footerClassName)}>
            {footer}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default MotionCard;