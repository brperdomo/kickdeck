import React from 'react';

interface AnimatedEventBackgroundProps {
  primaryColor: string;
  secondaryColor: string;
  className?: string;
  type?: 'gradients' | 'particles';
  speed?: 'slow' | 'medium' | 'fast';
  opacity?: number;
}

/**
 * Temporarily simplified background to prevent infinite component re-mounting
 * This will be restored once the Setup Intent issue is resolved
 */
export function AnimatedEventBackground({
  primaryColor = '#ffffff',
  secondaryColor = '#465132',
  className = '',
  type = 'gradients',
  speed = 'medium',
  opacity = 0.75
}: AnimatedEventBackgroundProps) {
  return (
    <div 
      className={`fixed top-0 left-0 w-full h-full ${className}`}
      style={{
        background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
        opacity: opacity * 0.3, // Reduced opacity for simplicity
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
}