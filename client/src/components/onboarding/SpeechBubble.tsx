import React from 'react';
import { cn } from '@/lib/utils';

interface SpeechBubbleProps {
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  children,
  position = 'left',
  className,
}) => {
  const positionClasses = {
    left: 'ml-4 before:left-[-10px] before:top-1/2 before:transform before:-translate-y-1/2 before:border-r-white before:border-r-8 before:border-y-transparent before:border-y-8 before:border-l-0',
    right: 'mr-4 after:right-[-10px] after:top-1/2 after:transform after:-translate-y-1/2 after:border-l-white after:border-l-8 after:border-y-transparent after:border-y-8 after:border-r-0',
    top: 'mt-4 before:top-[-10px] before:left-1/2 before:transform before:-translate-x-1/2 before:border-b-white before:border-b-8 before:border-x-transparent before:border-x-8 before:border-t-0',
    bottom: 'mb-4 after:bottom-[-10px] after:left-1/2 after:transform after:-translate-x-1/2 after:border-t-white after:border-t-8 after:border-x-transparent after:border-x-8 after:border-b-0',
  };

  return (
    <div
      className={cn(
        'relative bg-white p-4 rounded-lg shadow-md before:absolute after:absolute before:content-[""] after:content-[""] max-w-md',
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
};

export default SpeechBubble;