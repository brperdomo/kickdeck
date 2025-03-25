import React from 'react';
import { motion } from 'framer-motion';
import './onboarding.css';

// Define the possible emotions for the mascot
export type MascotEmotion = 
  | 'neutral' 
  | 'happy' 
  | 'excited' 
  | 'confused' 
  | 'thinking'
  | 'waving';

interface MascotCharacterProps {
  /**
   * The emotional state of the mascot
   */
  emotion?: MascotEmotion;
  
  /**
   * The size of the mascot
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether to animate the mascot
   */
  animate?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * A friendly mascot character that can display different emotions
 * Used throughout the onboarding experience to create a friendly, personalized feel
 */
const MascotCharacter: React.FC<MascotCharacterProps> = ({
  emotion = 'neutral',
  size = 'md',
  animate = true,
  className = '',
}) => {
  // Map sizes to actual pixel dimensions
  const sizeMap = {
    sm: { width: 36, height: 36 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };
  
  const dimensions = sizeMap[size];
  
  // Get the appropriate SVG based on emotion
  const getMascotSvg = () => {
    // Base shared styles and paths for the mascot character
    const baseStyles = {
      width: dimensions.width,
      height: dimensions.height,
    };
    
    // Bounce animation variants
    const bounceAnimation = animate ? {
      animate: {
        y: [0, -5, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut',
        },
      },
    } : {};
    
    // Common SVG structure for the soccer ball mascot
    const renderSoccerBall = (faceElements: React.ReactNode) => (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        style={baseStyles}
        className={`mascot ${className}`}
        {...bounceAnimation}
      >
        {/* Soccer ball body with hexagons */}
        <circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#000000" strokeWidth="2" />
        
        {/* Hexagonal pattern */}
        <path d="M32,2 C38,8 45,10 53,8 C57,18 57,28 53,38 C45,43 38,48 32,62 C25,48 18,43 10,38 C6,28 6,18 10,8 C18,10 25,8 32,2" 
              fill="none" stroke="#000000" strokeWidth="1.5" />
        
        {/* Face elements specific to emotion */}
        {faceElements}
      </motion.svg>
    );
    
    // Render different face expressions based on emotion
    switch (emotion) {
      case 'happy':
        return renderSoccerBall(
          <>
            {/* Happy eyes (curved upward) */}
            <path d="M24,25 Q26,22 28,25" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M36,25 Q38,22 40,25" stroke="#000" strokeWidth="2" fill="none" />
            
            {/* Happy smile */}
            <path d="M25,36 Q32,42 39,36" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
        
      case 'excited':
        return renderSoccerBall(
          <>
            {/* Wide eyes with stars */}
            <circle cx="26" cy="26" r="4" fill="#000" />
            <circle cx="38" cy="26" r="4" fill="#000" />
            <path d="M25,25 L27,23 M25,23 L27,25 M23,24 L29,24 M26,21 L26,27" stroke="#fff" strokeWidth="1" />
            <path d="M37,25 L39,23 M37,23 L39,25 M35,24 L41,24 M38,21 L38,27" stroke="#fff" strokeWidth="1" />
            
            {/* Open excited mouth */}
            <path d="M25,38 Q32,46 39,38" stroke="#000" strokeWidth="2" fill="#ff6b6b" />
          </>
        );
        
      case 'confused':
        return renderSoccerBall(
          <>
            {/* Asymmetrical eyes with raised eyebrow */}
            <circle cx="26" cy="26" r="3" fill="#000" />
            <path d="M36,24 Q38,22 40,24" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M23,20 Q26,18 29,21" stroke="#000" strokeWidth="1.5" fill="none" /> {/* Raised eyebrow */}
            
            {/* Unsure mouth */}
            <path d="M28,38 Q32,36 36,39" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
        
      case 'thinking':
        return renderSoccerBall(
          <>
            {/* Thoughtful eyes (one slightly closed) */}
            <path d="M24,26 Q26,26 28,26" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M36,26 Q38,24 40,26" stroke="#000" strokeWidth="2" fill="none" />
            
            {/* Thinking mouth */}
            <path d="M30,38 Q32,36 34,38" stroke="#000" strokeWidth="2" fill="none" />
            
            {/* Thought bubble */}
            <circle cx="45" cy="15" r="3" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="48" cy="10" r="4" fill="#fff" stroke="#000" strokeWidth="1" />
          </>
        );
        
      case 'waving':
        return (
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            style={baseStyles}
            className={`mascot ${className}`}
            {...bounceAnimation}
          >
            {/* Soccer ball body */}
            <circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#000000" strokeWidth="2" />
            
            {/* Hexagonal pattern */}
            <path d="M32,2 C38,8 45,10 53,8 C57,18 57,28 53,38 C45,43 38,48 32,62 C25,48 18,43 10,38 C6,28 6,18 10,8 C18,10 25,8 32,2" 
                  fill="none" stroke="#000000" strokeWidth="1.5" />
            
            {/* Happy eyes */}
            <path d="M24,25 Q26,22 28,25" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M36,25 Q38,22 40,25" stroke="#000" strokeWidth="2" fill="none" />
            
            {/* Happy smile */}
            <path d="M25,36 Q32,42 39,36" stroke="#000" strokeWidth="2" fill="none" />
            
            {/* Waving arm/hand */}
            <motion.path 
              d="M55,35 Q52,30 50,32 Q48,35 50,38" 
              fill="#ffffff" 
              stroke="#000000" 
              strokeWidth="1.5"
              animate={{ 
                rotate: [0, 15, 0, 15, 0], 
                x: 0,
                y: 0,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              transformOrigin="50 32"
            />
          </motion.svg>
        );
        
      case 'neutral':
      default:
        return renderSoccerBall(
          <>
            {/* Neutral eyes */}
            <circle cx="26" cy="26" r="3" fill="#000" />
            <circle cx="38" cy="26" r="3" fill="#000" />
            
            {/* Neutral mouth */}
            <path d="M28,38 Q32,38 36,38" stroke="#000" strokeWidth="2" fill="none" />
          </>
        );
    }
  };
  
  return getMascotSvg();
};

export default MascotCharacter;