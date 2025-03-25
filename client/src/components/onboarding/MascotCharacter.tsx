import React from 'react';
import './onboarding.css';

export type MascotEmotion = 'neutral' | 'happy' | 'excited' | 'thinking' | 'confused' | 'waving';
export type MascotSize = 'sm' | 'md' | 'lg' | 'xl';

interface MascotCharacterProps {
  /**
   * The emotional state of the mascot
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
   * Additional class names
   */
  className?: string;
}

/**
 * The mascot character component for the app's onboarding and guidance features
 * Supports different emotional states and sizes
 */
const MascotCharacter: React.FC<MascotCharacterProps> = ({
  emotion = 'neutral',
  size = 'md',
  animate = false,
  className = '',
}) => {
  // Size map (width in pixels)
  const sizeMap = {
    sm: 40,
    md: 80,
    lg: 120,
    xl: 160,
  };
  
  // Get the width based on size
  const width = sizeMap[size];
  
  // Build the class name with animation if needed
  const mascotClassName = `mascot-character ${animate ? 'animate' : ''} ${className}`;
  
  // Return the appropriate SVG based on the emotion
  const renderMascot = () => {
    switch (emotion) {
      case 'happy':
        return renderHappyMascot();
      case 'excited':
        return renderExcitedMascot();
      case 'thinking':
        return renderThinkingMascot();
      case 'confused':
        return renderConfusedMascot();
      case 'waving':
        return renderWavingMascot();
      case 'neutral':
      default:
        return renderNeutralMascot();
    }
  };
  
  // Neutral expression mascot
  const renderNeutralMascot = () => (
    <svg width={width} height={width} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={mascotClassName}>
      {/* Body */}
      <circle cx="100" cy="100" r="80" fill="#4F46E5" />
      
      {/* Eyes */}
      <circle cx="70" cy="80" r="10" fill="white" />
      <circle cx="130" cy="80" r="10" fill="white" />
      
      {/* Pupils */}
      <circle cx="70" cy="80" r="5" fill="#111827" />
      <circle cx="130" cy="80" r="5" fill="#111827" />
      
      {/* Mouth */}
      <path d="M80 120 Q100 130 120 120" stroke="white" strokeWidth="4" fill="none" />
    </svg>
  );
  
  // Happy expression mascot
  const renderHappyMascot = () => (
    <svg width={width} height={width} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={mascotClassName}>
      {/* Body */}
      <circle cx="100" cy="100" r="80" fill="#4F46E5" />
      
      {/* Eyes */}
      <circle cx="70" cy="80" r="10" fill="white" />
      <circle cx="130" cy="80" r="10" fill="white" />
      
      {/* Happy curved eyes */}
      <path d="M65 75 Q70 70 75 75" stroke="#111827" strokeWidth="3" fill="none" />
      <path d="M125 75 Q130 70 135 75" stroke="#111827" strokeWidth="3" fill="none" />
      
      {/* Big smile */}
      <path d="M70 120 Q100 150 130 120" stroke="white" strokeWidth="4" fill="none" />
    </svg>
  );
  
  // Excited expression mascot
  const renderExcitedMascot = () => (
    <svg width={width} height={width} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={mascotClassName}>
      {/* Body */}
      <circle cx="100" cy="100" r="80" fill="#4F46E5" />
      
      {/* Excited eyes with stars */}
      <path d="M70 80 L74 76 L66 76 L70 80 L70 88 L70 72" stroke="white" strokeWidth="2" fill="white" />
      <path d="M130 80 L134 76 L126 76 L130 80 L130 88 L130 72" stroke="white" strokeWidth="2" fill="white" />
      
      {/* Big open mouth */}
      <circle cx="100" cy="120" r="15" fill="white" />
    </svg>
  );
  
  // Thinking expression mascot
  const renderThinkingMascot = () => (
    <svg width={width} height={width} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={mascotClassName}>
      {/* Body */}
      <circle cx="100" cy="100" r="80" fill="#4F46E5" />
      
      {/* Eyes */}
      <circle cx="70" cy="80" r="10" fill="white" />
      <circle cx="130" cy="80" r="10" fill="white" />
      
      {/* Pupils looking up */}
      <circle cx="70" cy="75" r="5" fill="#111827" />
      <circle cx="130" cy="75" r="5" fill="#111827" />
      
      {/* Thinking mouth */}
      <path d="M90 120 L110 120" stroke="white" strokeWidth="4" fill="none" />
      
      {/* Thought bubble */}
      <circle cx="150" cy="50" r="10" fill="white" opacity="0.8" />
      <circle cx="140" cy="40" r="6" fill="white" opacity="0.6" />
      <circle cx="130" cy="35" r="3" fill="white" opacity="0.4" />
    </svg>
  );
  
  // Confused expression mascot
  const renderConfusedMascot = () => (
    <svg width={width} height={width} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={mascotClassName}>
      {/* Body */}
      <circle cx="100" cy="100" r="80" fill="#4F46E5" />
      
      {/* Eyes with raised eyebrow */}
      <circle cx="70" cy="80" r="10" fill="white" />
      <circle cx="130" cy="80" r="10" fill="white" />
      
      {/* Pupils */}
      <circle cx="70" cy="80" r="5" fill="#111827" />
      <circle cx="130" cy="80" r="5" fill="#111827" />
      
      {/* Eyebrows */}
      <path d="M60 70 L80 65" stroke="white" strokeWidth="3" fill="none" />
      <path d="M120 65 L140 70" stroke="white" strokeWidth="3" fill="none" />
      
      {/* Confused mouth */}
      <path d="M85 120 Q100 110 115 120" stroke="white" strokeWidth="4" fill="none" />
      
      {/* Question mark */}
      <text x="140" y="65" fill="white" fontSize="24" fontWeight="bold">?</text>
    </svg>
  );
  
  // Waving mascot
  const renderWavingMascot = () => (
    <svg width={width} height={width} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={mascotClassName}>
      {/* Body */}
      <circle cx="100" cy="100" r="80" fill="#4F46E5" />
      
      {/* Eyes */}
      <circle cx="70" cy="80" r="10" fill="white" />
      <circle cx="130" cy="80" r="10" fill="white" />
      
      {/* Pupils */}
      <circle cx="70" cy="80" r="5" fill="#111827" />
      <circle cx="130" cy="80" r="5" fill="#111827" />
      
      {/* Smile */}
      <path d="M75 120 Q100 140 125 120" stroke="white" strokeWidth="4" fill="none" />
      
      {/* Waving arm */}
      <g className="wave-arm">
        <path d="M170 100 L150 70 L140 60 L130 50" stroke="white" strokeWidth="6" fill="none" />
        <circle cx="170" cy="100" r="10" fill="white" /> {/* Hand */}
      </g>
    </svg>
  );
  
  return (
    <div className="mascot-character-container">
      {renderMascot()}
    </div>
  );
};

export default MascotCharacter;