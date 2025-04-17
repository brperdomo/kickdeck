import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AnimatedBackgroundProps {
  className?: string;
  type?: "gradients" | "particles" | "mesh";
  primaryColor?: string;
  secondaryColor?: string;
  speed?: "slow" | "medium" | "fast";
}

export function AnimatedBackground({
  className,
  type = "gradients",
  primaryColor = "#3d3a98",
  secondaryColor = "#2d2a88",
  speed = "medium",
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use different animation based on type
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Log for debugging
    console.log("AnimatedBackground initialized with type:", type);
    
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
        gradient.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.8)`);
        gradient.addColorStop(0.5, `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.8)`);
        
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
      // Configuration for particles
      const primary = hexToRgb(primaryColor);
      const secondary = hexToRgb(secondaryColor);
      const particles: Particle[] = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 6000); // Responsive particle count with increased density
      const speedFactor = speed === "slow" ? 0.5 : speed === "fast" ? 2 : 1;
      
      // Create initial particles
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          color: Math.random() > 0.5 ? 
            `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${Math.random() * 0.5 + 0.25})` : 
            `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, ${Math.random() * 0.5 + 0.25})`,
          speedX: (Math.random() - 0.5) * speedFactor,
          speedY: (Math.random() - 0.5) * speedFactor
        });
      }
      
      // Draw a dark background
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Particle animation
      const animate = () => {
        // Apply a semi-transparent overlay to create a trail effect
        ctx.fillStyle = "rgba(18, 18, 18, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
          // Move the particle
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          
          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;
          
          // Draw the particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
        });
        
        // Connect particles that are close to each other
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${0.3 * (1 - distance / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
    } else if (type === "mesh") {
      // Mesh grid configuration
      const primary = hexToRgb(primaryColor);
      const secondary = hexToRgb(secondaryColor);
      const cellSize = 50;
      const lineWidth = 1;
      const speedFactor = speed === "slow" ? 0.001 : speed === "fast" ? 0.004 : 0.002;
      let t = 0;
      
      // Draw the initial dark background
      ctx.fillStyle = `rgba(${primary.r * 0.1}, ${primary.g * 0.1}, ${primary.b * 0.1}, 1)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Mesh animation
      const animate = () => {
        // Clear canvas with a semi-transparent overlay for fade effect
        ctx.fillStyle = `rgba(${primary.r * 0.1}, ${primary.g * 0.1}, ${primary.b * 0.1}, 0.1)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate grid with time-based displacement
        const rows = Math.ceil(canvas.height / cellSize) + 1;
        const cols = Math.ceil(canvas.width / cellSize) + 1;
        
        // Draw vertical lines
        for (let i = 0; i < cols; i++) {
          const x = i * cellSize + Math.sin(t + i * 0.2) * 5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          const alpha = 0.3 + 0.2 * Math.sin(t + i * 0.1);
          ctx.strokeStyle = `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${alpha})`;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 0; i < rows; i++) {
          const y = i * cellSize + Math.cos(t + i * 0.2) * 5;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          const alpha = 0.3 + 0.2 * Math.cos(t + i * 0.1);
          ctx.strokeStyle = `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, ${alpha})`;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
        
        // Add some moving highlights
        for (let i = 0; i < 5; i++) {
          const x = canvas.width * (0.2 + 0.6 * Math.sin(t * 0.5 + i));
          const y = canvas.height * (0.2 + 0.6 * Math.cos(t * 0.7 + i));
          const radius = 50 + 20 * Math.sin(t + i);
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.4)`);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Update time
        t += speedFactor;
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
    }
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, primaryColor, secondaryColor, speed]);

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
}

// Type for particles animation
interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
}