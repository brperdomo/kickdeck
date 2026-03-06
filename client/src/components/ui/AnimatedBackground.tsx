import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AnimatedBackgroundProps {
  className?: string;
  type?: "gradients" | "particles" | "mesh" | "neon";
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
      // More subtle configuration for particles
      const primary = hexToRgb(primaryColor);
      const secondary = hexToRgb(secondaryColor);
      const accent = {r: 106, g: 103, b: 255}; // Brighter purple accent (#6A67FF)
      const particles: Particle[] = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000); // Reduced particle density
      const speedFactor = speed === "slow" ? 0.3 : speed === "fast" ? 0.8 : 0.5; // Reduced speed
      
      // Create initial particles with more subtle appearance
      for (let i = 0; i < particleCount; i++) {
        // Determine if this is a special "pulse" particle (reduced to 5% chance)
        const isPulseParticle = Math.random() < 0.05;
        const colorRand = Math.random();
        
        // Use different color distribution with lower opacity
        let particleColor;
        if (isPulseParticle) {
          // Special pulsing particles get the accent color with moderate opacity
          particleColor = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${Math.random() * 0.2 + 0.4})`;
        } else if (colorRand > 0.7) {
          particleColor = `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${Math.random() * 0.2 + 0.2})`;
        } else if (colorRand > 0.3) {
          particleColor = `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, ${Math.random() * 0.2 + 0.2})`;
        } else {
          particleColor = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${Math.random() * 0.2 + 0.1})`;
        }
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: isPulseParticle ? Math.random() * 3 + 2 : Math.random() * 2 + 0.5, // Smaller particle sizes
          color: particleColor,
          speedX: (Math.random() - 0.5) * speedFactor * (isPulseParticle ? 0.5 : 1), // Slower movement
          speedY: (Math.random() - 0.5) * speedFactor * (isPulseParticle ? 0.5 : 1),
          isPulse: isPulseParticle,
          pulseSize: 0,
          pulseDirection: 1, // 1 for growing, -1 for shrinking
          pulseSpeed: Math.random() * 0.03 + 0.01 // Slower pulse
        });
      }
      
      // Draw a dark background
      ctx.fillStyle = "#0F0F1A"; // Slightly blue-tinted dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Particle animation
      const animate = () => {
        // Apply a more opaque overlay to create a subtle trail effect
        ctx.fillStyle = "rgba(15, 15, 26, 0.15)"; // Increased opacity for faster fade and subtler trails
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
          if (particle.isPulse && particle.pulseSize !== undefined && 
              particle.pulseDirection !== undefined && particle.pulseSpeed !== undefined) {
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
            
            // Reduced connection distance for subtlety
            if (distance < 100) {
              // Determine if either particle is a pulse particle
              const hasPulse = particles[i].isPulse || particles[j].isPulse;
              
              // Calculate opacity based on distance - reduced opacity for subtlety
              const opacity = hasPulse ? 
                0.25 * (1 - distance / 100) : 
                0.15 * (1 - distance / 100);
              
              // Choose color based on whether it's a pulse connection
              const connectionColor = hasPulse ?
                `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${opacity})` :
                `rgba(${primary.r}, ${primary.g}, ${primary.b}, ${opacity})`;
                
              // Draw the connection with thinner lines
              ctx.beginPath();
              ctx.strokeStyle = connectionColor;
              ctx.lineWidth = hasPulse ? 0.6 : 0.3; // Thinner lines for subtlety
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
    } else if (type === "neon") {
      // === SYNTHWAVE / 80s RETRO NEON ANIMATION ===
      // Starfield sky, segmented sunset, scrolling perspective grid, CRT scan lines

      const speedFactor = speed === "slow" ? 0.0008 : speed === "fast" ? 0.003 : 0.0015;
      let t = 0;

      // Neon color palette
      const neonColors = {
        violet: { r: 124, g: 58, b: 237 },
        purple: { r: 168, g: 85, b: 247 },
        cyan:   { r: 6, g: 182, b: 212 },
        pink:   { r: 236, g: 72, b: 153 },
        hotPink:{ r: 255, g: 16, b: 120 },
        orange: { r: 255, g: 120, b: 30 },
      };

      // Stars configuration
      interface Star {
        x: number;
        y: number;
        size: number;
        baseAlpha: number;
        twinkleSpeed: number;
        twinklePhase: number;
      }
      const stars: Star[] = [];
      const starCount = 80;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.45, // only in upper sky
          size: Math.random() * 1.5 + 0.3,
          baseAlpha: Math.random() * 0.4 + 0.2,
          twinkleSpeed: Math.random() * 2 + 1,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }

      // Grid scroll offset
      let gridScroll = 0;
      const gridScrollSpeed = speed === "slow" ? 0.3 : speed === "fast" ? 1.0 : 0.5;

      // Initial fill
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const animate = () => {
        const W = canvas.width;
        const H = canvas.height;

        // --- Full clear each frame (no trails) ---
        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, W, H);

        // --- Layer 1: Sky gradient (deep space to horizon glow) ---
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
        skyGrad.addColorStop(0, "#0a0a1a");
        skyGrad.addColorStop(0.6, "#0d0b2e");
        skyGrad.addColorStop(0.85, "#1a0a3a");
        skyGrad.addColorStop(1, "#2d1050");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H * 0.5);

        // --- Layer 2: Starfield ---
        stars.forEach(star => {
          const twinkle = Math.sin(t * star.twinkleSpeed + star.twinklePhase);
          const alpha = star.baseAlpha + twinkle * 0.2;
          if (alpha <= 0) return;

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
          ctx.fill();

          // Brighter stars get a tiny cross-shaped glint
          if (star.size > 1.2 && alpha > 0.35) {
            const glintLen = star.size * 2.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star.x - glintLen, star.y);
            ctx.lineTo(star.x + glintLen, star.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(star.x, star.y - glintLen);
            ctx.lineTo(star.x, star.y + glintLen);
            ctx.stroke();
          }
        });

        // --- Layer 3: Floor + Sun + Grid ---
        const horizonY = H * 0.48;
        const sunCenterY = horizonY - H * 0.02;
        const sunRadius = Math.min(W, H) * 0.18;
        const vanishX = W * 0.5;
        const vanishY = horizonY;
        const gridBottom = H;
        const gridHeight = gridBottom - vanishY;

        // 3a: Floor gradient (below horizon, drawn FIRST so sun sits on top)
        const floorGrad = ctx.createLinearGradient(0, vanishY, 0, gridBottom);
        floorGrad.addColorStop(0, "rgba(20, 5, 50, 0.5)");
        floorGrad.addColorStop(1, "rgba(10, 10, 26, 0.9)");
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, vanishY, W, gridHeight);

        // 3b: Sun glow (outer aura — drawn before disc)
        const sunGlow = ctx.createRadialGradient(
          W * 0.5, sunCenterY, sunRadius * 0.5,
          W * 0.5, sunCenterY, sunRadius * 2.5
        );
        sunGlow.addColorStop(0, "rgba(255, 60, 120, 0.14)");
        sunGlow.addColorStop(0.4, "rgba(168, 85, 247, 0.07)");
        sunGlow.addColorStop(1, "rgba(10, 10, 26, 0)");
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, W, H * 0.65);

        // 3c: Sun disc with gradient (hot pink top → orange bottom)
        ctx.save();
        ctx.beginPath();
        ctx.arc(W * 0.5, sunCenterY, sunRadius, 0, Math.PI * 2);
        ctx.clip();

        const sunGrad = ctx.createLinearGradient(W * 0.5, sunCenterY - sunRadius, W * 0.5, sunCenterY + sunRadius);
        sunGrad.addColorStop(0, "rgba(255, 50, 160, 0.95)");
        sunGrad.addColorStop(0.35, "rgba(255, 70, 110, 0.9)");
        sunGrad.addColorStop(0.6, "rgba(255, 130, 50, 0.88)");
        sunGrad.addColorStop(1, "rgba(255, 200, 40, 0.85)");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(W * 0.5 - sunRadius, sunCenterY - sunRadius, sunRadius * 2, sunRadius * 2);

        // Cut horizontal slices out of the bottom half (classic 80s segmented sun)
        ctx.globalCompositeOperation = "destination-out";
        const sliceCount = 7;
        const sliceRegionTop = sunCenterY + sunRadius * 0.05;
        const sliceRegionHeight = sunRadius * 0.95;
        for (let i = 0; i < sliceCount; i++) {
          const sliceFrac = i / sliceCount;
          const sliceY = sliceRegionTop + sliceFrac * sliceRegionHeight;
          const gapHeight = 1.5 + sliceFrac * 4.5;
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.fillRect(W * 0.5 - sunRadius, sliceY, sunRadius * 2, gapHeight);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();

        // 3d: Horizon line glow
        const horizonGlow = ctx.createLinearGradient(0, horizonY - 4, 0, horizonY + 4);
        horizonGlow.addColorStop(0, "rgba(168, 85, 247, 0)");
        horizonGlow.addColorStop(0.5, "rgba(168, 85, 247, 0.2)");
        horizonGlow.addColorStop(1, "rgba(168, 85, 247, 0)");
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, horizonY - 4, W, 8);

        // 3e: Grid lines (clipped below horizon, drawn AFTER sun)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, vanishY, W, gridHeight);
        ctx.clip();

        // Scrolling horizontal lines
        gridScroll = (gridScroll + gridScrollSpeed * 0.008) % 1;
        const hLineCount = 22;
        for (let i = 0; i <= hLineCount; i++) {
          // Lines scroll toward the viewer — offset by gridScroll
          const rawFrac = ((i + gridScroll) / hLineCount) % 1;
          const fraction = Math.pow(rawFrac, 2.0);
          const y = vanishY + fraction * gridHeight;

          const opacity = 0.06 + fraction * 0.18;
          const lineWidth = 0.4 + fraction * 1.0;

          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.strokeStyle = `rgba(${neonColors.cyan.r}, ${neonColors.cyan.g}, ${neonColors.cyan.b}, ${opacity})`;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }

        // Vertical lines (fanning from vanishing point)
        const vLineCount = 28;
        for (let i = 0; i <= vLineCount; i++) {
          const fraction = i / vLineCount;
          const bottomX = (fraction - 0.5) * W * 3.0 + W * 0.5;

          const distFromCenter = Math.abs(fraction - 0.5) * 2;
          const opacity = 0.08 + (1 - distFromCenter) * 0.08;

          ctx.beginPath();
          ctx.moveTo(vanishX, vanishY);
          ctx.lineTo(bottomX, gridBottom);
          ctx.strokeStyle = `rgba(${neonColors.violet.r}, ${neonColors.violet.g}, ${neonColors.violet.b}, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }

        ctx.restore(); // remove grid clip

        // --- Layer 5: CRT scan lines (very subtle) ---
        ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
        for (let y = 0; y < H; y += 3) {
          ctx.fillRect(0, y, W, 1);
        }

        // --- Layer 6: Corner vignette ---
        const vignetteGrad = ctx.createRadialGradient(
          W * 0.5, H * 0.5, Math.min(W, H) * 0.3,
          W * 0.5, H * 0.5, Math.max(W, H) * 0.8
        );
        vignetteGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
        vignetteGrad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, W, H);

        t += speedFactor;
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