import React, { useRef, useEffect } from 'react';

interface AnimatedEventBackgroundProps {
  primaryColor: string;
  secondaryColor: string;
  className?: string;
  type?: 'gradients' | 'particles';
  speed?: 'slow' | 'medium' | 'fast';
  opacity?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

/**
 * AnimatedEventBackground - Creates a canvas-based animated background using event branding colors
 * This is based on the AnimatedBackground component but specifically for event theming
 */
export function AnimatedEventBackground({
  primaryColor = '#ffffff',
  secondaryColor = '#465132',
  className = '',
  type = 'gradients',
  speed = 'medium',
  opacity = 0.75
}: AnimatedEventBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Log detailed color information for debugging
  console.log("AnimatedEventBackground CONSTRUCTOR - Received colors:", {
    primaryColor,
    secondaryColor,
    type,
    opacity
  });
  
  // Use different animation based on type
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    console.log("AnimatedEventBackground INITIALIZED with colors:", {
      primaryColor,
      secondaryColor,
      validPrimary: typeof primaryColor === 'string' && primaryColor.length > 0,
      validSecondary: typeof secondaryColor === 'string' && secondaryColor.length > 0,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });
    
    // Set canvas to full screen
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    let animationFrameId: number;
    
    // Choose animation based on type
    if (type === "gradients") {
      // Convert hex colors to RGB for animation
      const primary = hexToRgb(primaryColor);
      const secondary = hexToRgb(secondaryColor);
      
      // Animation parameters
      const speedFactor = speed === "slow" ? 0.0005 : speed === "fast" ? 0.002 : 0.001;
      let t = 0;
      
      // Gradient animation
      const animate = () => {
        // Create gradient with moving center points
        const gradient = ctx.createRadialGradient(
          canvas.width * (0.5 + 0.2 * Math.sin(t)),  // x0
          canvas.height * (0.5 + 0.2 * Math.cos(t)), // y0
          canvas.width * 0.1,                       // r0
          canvas.width * (0.5 + 0.2 * Math.cos(t)),  // x1
          canvas.height * (0.5 + 0.2 * Math.sin(t)), // y1
          canvas.width * 0.8                         // r1
        );
        
        // Apply colors with opacity for a richer effect
        gradient.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, ${opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${opacity * 0.8})`);
        
        // Fill background
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update time
        t += speedFactor;
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
    } else if (type === "particles") {
      // Convert colors for particles
      const primary = hexToRgb(primaryColor);
      const secondary = hexToRgb(secondaryColor);
      
      // Create accent color by brightening the primary color
      const accent = brightenColor(primary, 20);
      
      const particles: Particle[] = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 20000); // Reduced density
      const speedFactor = speed === "slow" ? 0.3 : speed === "fast" ? 0.8 : 0.5;
      
      // Create initial particles with more subtle appearance
      for (let i = 0; i < particleCount; i++) {
        // Randomly choose between primary, secondary and accent colors
        const colorChoice = Math.random();
        let particleColor: { r: number, g: number, b: number };
        
        if (colorChoice < 0.45) {
          particleColor = primary;
        } else if (colorChoice < 0.9) {
          particleColor = secondary;
        } else {
          particleColor = accent;
        }
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1, // Particle size between 1-4
          speedX: (Math.random() - 0.5) * speedFactor,
          speedY: (Math.random() - 0.5) * speedFactor,
          color: `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${opacity})`
        });
      }
      
      const animate = () => {
        // Clear canvas with a very subtle background color for better blending
        ctx.fillStyle = `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.01)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
          // Update position
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          
          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;
          
          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
        });
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [primaryColor, secondaryColor, type, speed, opacity]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute top-0 left-0 w-full h-full z-[-1] ${className}`}
    />
  );
}

// Helper functions for color manipulation
function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle shorthand hex codes
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse the hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
}

function brightenColor(color: { r: number, g: number, b: number }, percent: number) {
  const factor = 1 + percent / 100;
  return {
    r: Math.min(255, Math.floor(color.r * factor)),
    g: Math.min(255, Math.floor(color.g * factor)),
    b: Math.min(255, Math.floor(color.b * factor))
  };
}