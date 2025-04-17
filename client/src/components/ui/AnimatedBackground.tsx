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
      // Enhanced configuration for particles
      const primary = hexToRgb(primaryColor);
      const secondary = hexToRgb(secondaryColor);
      const accent = {r: 106, g: 103, b: 255}; // Brighter purple accent (#6A67FF)
      const particles: Particle[] = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 4000); // Increased particle density
      const speedFactor = speed === "slow" ? 0.8 : speed === "fast" ? 2.5 : 1.5;
      
      // Create initial particles with more variety
      for (let i = 0; i < particleCount; i++) {
        // Determine if this is a special "pulse" particle (10% chance)
        const isPulseParticle = Math.random() < 0.1;
        const colorRand = Math.random();
        
        // Use different color distribution
        let particleColor;
        if (isPulseParticle) {
          // Special pulsing particles get the accent color with higher opacity
          particleColor = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${Math.random() * 0.3 + 0.7})`;
        } else if (colorRand > 0.7) {
          particleColor = `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${Math.random() * 0.4 + 0.4})`;
        } else if (colorRand > 0.3) {
          particleColor = `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, ${Math.random() * 0.4 + 0.4})`;
        } else {
          particleColor = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${Math.random() * 0.4 + 0.2})`;
        }
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: isPulseParticle ? Math.random() * 5 + 3 : Math.random() * 3 + 1, // Larger for pulse particles
          color: particleColor,
          speedX: (Math.random() - 0.5) * speedFactor * (isPulseParticle ? 0.7 : 1), // Pulse particles move slower
          speedY: (Math.random() - 0.5) * speedFactor * (isPulseParticle ? 0.7 : 1),
          isPulse: isPulseParticle,
          pulseSize: 0,
          pulseDirection: 1, // 1 for growing, -1 for shrinking
          pulseSpeed: Math.random() * 0.05 + 0.02
        });
      }
      
      // Draw a dark background
      ctx.fillStyle = "#0F0F1A"; // Slightly blue-tinted dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Particle animation
      const animate = () => {
        // Apply a semi-transparent overlay to create a trail effect
        ctx.fillStyle = "rgba(15, 15, 26, 0.08)"; // Faster fade for more active feel
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
          
          // For pulse particles, animate the size
          if (particle.isPulse) {
            // Update pulse size
            particle.pulseSize += particle.pulseDirection * particle.pulseSpeed;
            
            // Reverse direction if reaching limits
            if (particle.pulseSize > 1.5) particle.pulseDirection = -1;
            if (particle.pulseSize < -0.5) particle.pulseDirection = 1;
            
            // Draw the pulse glow effect (larger circle with gradient)
            const gradient = ctx.createRadialGradient(
              particle.x, particle.y, 0,
              particle.x, particle.y, particle.size * (2 + particle.pulseSize)
            );
            
            const color = particle.color.replace(/[\d\.]+\)$/g, "0.1)"); // Lower opacity version for glow
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, color);
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (2 + particle.pulseSize), 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
          
          // Draw the particle core
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
            
            // Increased connection distance
            if (distance < 150) {
              // Determine if either particle is a pulse particle
              const hasPulse = particles[i].isPulse || particles[j].isPulse;
              
              // Calculate opacity based on distance - higher for pulse connections
              const opacity = hasPulse ? 
                0.5 * (1 - distance / 150) : 
                0.35 * (1 - distance / 150);
              
              // Choose color based on whether it's a pulse connection
              const connectionColor = hasPulse ?
                `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${opacity})` :
                `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${opacity})`;
                
              // Draw the connection
              ctx.beginPath();
              ctx.strokeStyle = connectionColor;
              ctx.lineWidth = hasPulse ? 1 : 0.6; // Thicker lines for pulse particles
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
  isPulse?: boolean;
  pulseSize?: number;
  pulseDirection?: number;
  pulseSpeed?: number;
}