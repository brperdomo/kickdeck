import React from 'react';
import { cn } from '@/lib/utils';
import './onboarding.css';

// All the possible mascot emotions we can render
export type MascotEmotion = 
  | 'neutral'      // Default expression 
  | 'happy'        // Excited, smiling expression
  | 'thinking'     // Thoughtful, pondering expression
  | 'confused'     // Confused or puzzled expression
  | 'pointing'     // Pointing to highlight a feature
  | 'thumbsUp'     // Giving a thumbs up for success/approval
  | 'waving'       // Waving hello
  | 'surprised'    // Surprised or shocked expression
  | 'celebrating'  // Celebrating an accomplishment

// Size options for the mascot
type MascotSize = 'sm' | 'md' | 'lg' | 'xl';

interface MascotCharacterProps {
  /**
   * Emotional expression of the mascot
   */
  emotion?: MascotEmotion;
  
  /**
   * Size of the mascot
   */
  size?: MascotSize;
  
  /**
   * Whether to animate the mascot
   */
  animate?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MascotCharacter component that displays different emotional states
 * and can be animated to guide the user through the onboarding process.
 */
const MascotCharacter: React.FC<MascotCharacterProps> = ({
  emotion = 'neutral',
  size = 'md',
  animate = false,
  className,
}) => {
  // Map size to dimensions (width/height in pixels)
  const getSizeDimensions = (): { width: number; height: number } => {
    switch (size) {
      case 'sm': return { width: 40, height: 40 };
      case 'md': return { width: 60, height: 60 };
      case 'lg': return { width: 80, height: 80 };
      case 'xl': return { width: 120, height: 120 };
      default: return { width: 60, height: 60 }; // Default to medium
    }
  };
  
  // Get SVG content based on emotion
  const renderMascotSVG = () => {
    const { width, height } = getSizeDimensions();
    
    // Common SVG attributes
    const svgProps = {
      width,
      height,
      viewBox: "0 0 100 100",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className: cn(
        "mascot-character",
        animate && "animate",
        className
      )
    };
    
    switch (emotion) {
      case 'happy':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Eyes */}
            <circle cx="35" cy="45" r="5" fill="#312E81" />
            <circle cx="65" cy="45" r="5" fill="#312E81" />
            
            {/* Smile */}
            <path d="M35 65 Q50 80 65 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Rosy cheeks */}
            <circle cx="28" cy="55" r="5" fill="#FDA4AF" fillOpacity="0.6" />
            <circle cx="72" cy="55" r="5" fill="#FDA4AF" fillOpacity="0.6" />
          </svg>
        );
      
      case 'thinking':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Eyes */}
            <circle cx="35" cy="45" r="5" fill="#312E81" />
            <circle cx="65" cy="45" r="5" fill="#312E81" />
            
            {/* Thinking expression - raised eyebrow and hand */}
            <path d="M30 38 Q35 35 40 38" stroke="#312E81" strokeWidth="2" strokeLinecap="round" />
            <path d="M40 65 Q50 67 60 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Hand on chin */}
            <path d="M20 70 Q35 85 40 70" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" />
            
            {/* Thought bubble */}
            <circle cx="80" cy="25" r="3" fill="#C7D2FE" />
            <circle cx="85" cy="20" r="5" fill="#C7D2FE" />
            <circle cx="92" cy="15" r="7" fill="#C7D2FE" />
          </svg>
        );
      
      case 'confused':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Eyes */}
            <circle cx="35" cy="45" r="5" fill="#312E81" />
            <circle cx="65" cy="45" r="5" fill="#312E81" />
            
            {/* Confused expression - raised eyebrow and squiggly mouth */}
            <path d="M30 38 Q35 35 40 38" stroke="#312E81" strokeWidth="2" strokeLinecap="round" />
            <path d="M35 65 Q45 60 50 65 Q55 70 65 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Question mark above head */}
            <path d="M65 15 Q75 15 75 25 Q75 35 65 35 L65 45" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            <circle cx="65" cy="50" r="2" fill="#312E81" />
          </svg>
        );
      
      case 'pointing':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Eyes */}
            <circle cx="35" cy="45" r="5" fill="#312E81" />
            <circle cx="65" cy="45" r="5" fill="#312E81" />
            
            {/* Neutral expression */}
            <path d="M40 65 Q50 67 60 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Pointing arm */}
            <path d="M80 30 L100 10" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" />
            <path d="M75 45 Q85 35 80 30" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
      
      case 'thumbsUp':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Eyes */}
            <circle cx="35" cy="45" r="5" fill="#312E81" />
            <circle cx="65" cy="45" r="5" fill="#312E81" />
            
            {/* Smile */}
            <path d="M35 65 Q50 75 65 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Thumbs up arm */}
            <path d="M75 40 L85 25 L95 35 L90 50 L75 40Z" fill="#4F46E5" stroke="#312E81" strokeWidth="2" />
            <path d="M75 50 Q65 70 75 40" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
      
      case 'waving':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Eyes */}
            <circle cx="35" cy="45" r="5" fill="#312E81" />
            <circle cx="65" cy="45" r="5" fill="#312E81" />
            
            {/* Smile */}
            <path d="M35 65 Q50 75 65 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Waving arm */}
            <path 
              d="M85 30 Q95 20 90 10" 
              stroke="#4F46E5" 
              strokeWidth="5" 
              strokeLinecap="round"
              className="wave-arm"
            />
            <path d="M75 45 Q85 35 85 30" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
      
      case 'surprised':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Wide eyes */}
            <circle cx="35" cy="45" r="7" fill="#312E81" />
            <circle cx="65" cy="45" r="7" fill="#312E81" />
            <circle cx="35" cy="45" r="2" fill="white" />
            <circle cx="65" cy="45" r="2" fill="white" />
            
            {/* Surprised mouth */}
            <circle cx="50" cy="65" r="8" fill="#312E81" />
            <circle cx="50" cy="63" r="5" fill="#C7D2FE" />
            
            {/* Exclamation mark */}
            <path d="M50 10 L50 25" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="30" r="2" fill="#312E81" />
          </svg>
        );
      
      case 'celebrating':
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Happy eyes */}
            <path d="M30 43 Q35 38 40 43" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            <path d="M60 43 Q65 38 70 43" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Big smile */}
            <path d="M35 65 Q50 80 65 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
            
            {/* Party hat */}
            <path d="M30 20 L50 5 L70 20" fill="#FCD34D" stroke="#312E81" strokeWidth="2" />
            
            {/* Confetti */}
            <circle cx="25" cy="25" r="2" fill="#EC4899" />
            <circle cx="35" cy="15" r="2" fill="#10B981" />
            <circle cx="75" cy="25" r="2" fill="#EC4899" />
            <circle cx="85" cy="35" r="2" fill="#10B981" />
            <path d="M20 30 L25 35" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
            <path d="M70 15 L75 20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            <path d="M80 25 L85 30" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      
      case 'neutral':
      default:
        return (
          <svg {...svgProps}>
            {/* Base mascot body */}
            <circle cx="50" cy="50" r="45" fill="#4F46E5" />
            
            {/* Face */}
            <circle cx="50" cy="50" r="35" fill="#C7D2FE" />
            
            {/* Eyes */}
            <circle cx="35" cy="45" r="5" fill="#312E81" />
            <circle cx="65" cy="45" r="5" fill="#312E81" />
            
            {/* Neutral expression */}
            <path d="M40 65 Q50 67 60 65" stroke="#312E81" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
    }
  };
  
  return (
    <div className="mascot-character-container">
      {renderMascotSVG()}
    </div>
  );
};

export default MascotCharacter;