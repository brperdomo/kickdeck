import React from 'react';

type MascotEmotions = 'happy' | 'excited' | 'thinking' | 'pointing' | 'waving' | 'celebrating';
type MascotSizes = 'sm' | 'md' | 'lg' | 'xl';

interface MascotCharacterProps {
  emotion?: MascotEmotions;
  size?: MascotSizes;
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  emotion = 'happy',
  size = 'md',
  className = '',
  animated = true,
}) => {
  const sizeClass = sizeMap[size];
  const animationClass = animated ? 'animate-mascot-bounce' : '';

  return (
    <div className={`${sizeClass} ${animationClass} ${className}`}>
      {emotion === 'happy' && (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Soccer ball head */}
          <circle cx="100" cy="90" r="70" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <path d="M100,20 Q140,40 130,90 Q100,110 70,90 Q60,40 100,20" fill="#000000" />
          <path d="M70,90 Q60,150 100,160 Q140,150 130,90" fill="#000000" />
          <path d="M100,20 Q60,40 70,90 M130,90 Q140,40 100,20" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q100,110 130,90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q60,150 100,160 M130,90 Q140,150 100,160" fill="none" stroke="#FFFFFF" strokeWidth="2" />

          {/* Happy face */}
          <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="80" cy="75" r="4" fill="#000000" />
          <circle cx="120" cy="75" r="4" fill="#000000" />
          <path d="M85,100 Q100,115 115,100" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

          {/* Body */}
          <rect x="85" y="160" width="30" height="40" rx="5" fill="#4CAF50" />
          
          {/* Arms */}
          <path d="M85,170 Q65,165 60,180" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M115,170 Q135,165 140,180" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Legs */}
          <path d="M90,200 L85,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M110,200 L115,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Soccer shoes */}
          <ellipse cx="80" cy="225" rx="10" ry="5" fill="#000000" />
          <ellipse cx="120" cy="225" rx="10" ry="5" fill="#000000" />
        </svg>
      )}

      {emotion === 'excited' && (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Soccer ball head */}
          <circle cx="100" cy="90" r="70" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <path d="M100,20 Q140,40 130,90 Q100,110 70,90 Q60,40 100,20" fill="#000000" />
          <path d="M70,90 Q60,150 100,160 Q140,150 130,90" fill="#000000" />
          <path d="M100,20 Q60,40 70,90 M130,90 Q140,40 100,20" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q100,110 130,90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q60,150 100,160 M130,90 Q140,150 100,160" fill="none" stroke="#FFFFFF" strokeWidth="2" />

          {/* Excited face */}
          <circle cx="80" cy="75" r="10" fill="#FFFFFF" />
          <circle cx="120" cy="75" r="10" fill="#FFFFFF" />
          <circle cx="80" cy="75" r="5" fill="#000000" />
          <circle cx="120" cy="75" r="5" fill="#000000" />
          <path d="M80,110 Q100,125 120,110" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />

          {/* Body */}
          <rect x="85" y="160" width="30" height="40" rx="5" fill="#4CAF50" />
          
          {/* Arms raised */}
          <path d="M85,165 Q75,140 60,130" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M115,165 Q125,140 140,130" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Legs */}
          <path d="M90,200 L85,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M110,200 L115,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Soccer shoes */}
          <ellipse cx="80" cy="225" rx="10" ry="5" fill="#000000" />
          <ellipse cx="120" cy="225" rx="10" ry="5" fill="#000000" />
        </svg>
      )}

      {emotion === 'thinking' && (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Soccer ball head */}
          <circle cx="100" cy="90" r="70" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <path d="M100,20 Q140,40 130,90 Q100,110 70,90 Q60,40 100,20" fill="#000000" />
          <path d="M70,90 Q60,150 100,160 Q140,150 130,90" fill="#000000" />
          <path d="M100,20 Q60,40 70,90 M130,90 Q140,40 100,20" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q100,110 130,90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q60,150 100,160 M130,90 Q140,150 100,160" fill="none" stroke="#FFFFFF" strokeWidth="2" />

          {/* Thinking face */}
          <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="80" cy="73" r="4" fill="#000000" />
          <circle cx="120" cy="73" r="4" fill="#000000" />
          <path d="M90,105 L110,105" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          
          {/* Thinking bubble */}
          <circle cx="150" cy="50" r="15" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <circle cx="130" cy="30" r="8" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <circle cx="120" cy="15" r="4" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />

          {/* Body */}
          <rect x="85" y="160" width="30" height="40" rx="5" fill="#4CAF50" />
          
          {/* Arms */}
          <path d="M85,170 Q70,175 60,165" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M115,170 Q125,160 140,155" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Legs */}
          <path d="M90,200 L85,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M110,200 L115,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Soccer shoes */}
          <ellipse cx="80" cy="225" rx="10" ry="5" fill="#000000" />
          <ellipse cx="120" cy="225" rx="10" ry="5" fill="#000000" />
        </svg>
      )}

      {emotion === 'pointing' && (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Soccer ball head */}
          <circle cx="100" cy="90" r="70" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <path d="M100,20 Q140,40 130,90 Q100,110 70,90 Q60,40 100,20" fill="#000000" />
          <path d="M70,90 Q60,150 100,160 Q140,150 130,90" fill="#000000" />
          <path d="M100,20 Q60,40 70,90 M130,90 Q140,40 100,20" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q100,110 130,90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q60,150 100,160 M130,90 Q140,150 100,160" fill="none" stroke="#FFFFFF" strokeWidth="2" />

          {/* Face */}
          <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="80" cy="75" r="4" fill="#000000" />
          <circle cx="120" cy="75" r="4" fill="#000000" />
          <path d="M90,100 Q100,110 110,100" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

          {/* Body */}
          <rect x="85" y="160" width="30" height="40" rx="5" fill="#4CAF50" />
          
          {/* Arms - one pointing */}
          <path d="M85,170 Q65,175 60,180" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M115,170 Q135,160 155,145" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <circle cx="160" cy="140" r="6" fill="#4CAF50" />
          
          {/* Legs */}
          <path d="M90,200 L85,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M110,200 L115,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Soccer shoes */}
          <ellipse cx="80" cy="225" rx="10" ry="5" fill="#000000" />
          <ellipse cx="120" cy="225" rx="10" ry="5" fill="#000000" />
        </svg>
      )}

      {emotion === 'waving' && (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Soccer ball head */}
          <circle cx="100" cy="90" r="70" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <path d="M100,20 Q140,40 130,90 Q100,110 70,90 Q60,40 100,20" fill="#000000" />
          <path d="M70,90 Q60,150 100,160 Q140,150 130,90" fill="#000000" />
          <path d="M100,20 Q60,40 70,90 M130,90 Q140,40 100,20" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q100,110 130,90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q60,150 100,160 M130,90 Q140,150 100,160" fill="none" stroke="#FFFFFF" strokeWidth="2" />

          {/* Face */}
          <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="80" cy="75" r="4" fill="#000000" />
          <circle cx="120" cy="75" r="4" fill="#000000" />
          <path d="M85,100 Q100,115 115,100" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

          {/* Body */}
          <rect x="85" y="160" width="30" height="40" rx="5" fill="#4CAF50" />
          
          {/* Arms - one waving */}
          <path d="M85,170 Q65,165 60,180" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M115,170 Q125,150 140,130" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Legs */}
          <path d="M90,200 L85,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M110,200 L115,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Soccer shoes */}
          <ellipse cx="80" cy="225" rx="10" ry="5" fill="#000000" />
          <ellipse cx="120" cy="225" rx="10" ry="5" fill="#000000" />
        </svg>
      )}

      {emotion === 'celebrating' && (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* Soccer ball head */}
          <circle cx="100" cy="90" r="70" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
          <path d="M100,20 Q140,40 130,90 Q100,110 70,90 Q60,40 100,20" fill="#000000" />
          <path d="M70,90 Q60,150 100,160 Q140,150 130,90" fill="#000000" />
          <path d="M100,20 Q60,40 70,90 M130,90 Q140,40 100,20" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q100,110 130,90" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M70,90 Q60,150 100,160 M130,90 Q140,150 100,160" fill="none" stroke="#FFFFFF" strokeWidth="2" />

          {/* Face */}
          <circle cx="80" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="120" cy="75" r="8" fill="#FFFFFF" />
          <circle cx="80" cy="75" r="4" fill="#000000" />
          <circle cx="120" cy="75" r="4" fill="#000000" />
          <path d="M80,110 Q100,125 120,110" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          
          {/* Confetti */}
          <circle cx="70" cy="40" r="5" fill="#FF5252" />
          <circle cx="140" cy="50" r="5" fill="#FFEB3B" />
          <circle cx="50" cy="100" r="5" fill="#2196F3" />
          <circle cx="150" cy="100" r="5" fill="#FF9800" />
          <rect x="60" y="60" width="10" height="10" rx="2" fill="#9C27B0" transform="rotate(45, 65, 65)" />
          <rect x="130" cy="70" width="10" height="10" rx="2" fill="#4CAF50" transform="rotate(30, 135, 75)" />

          {/* Body */}
          <rect x="85" y="160" width="30" height="40" rx="5" fill="#4CAF50" />
          
          {/* Arms raised high */}
          <path d="M85,165 Q75,135 60,120" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M115,165 Q125,135 140,120" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Legs - one foot raised */}
          <path d="M90,200 L85,220" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          <path d="M110,200 L115,190" fill="none" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" />
          
          {/* Soccer shoes */}
          <ellipse cx="80" cy="225" rx="10" ry="5" fill="#000000" />
          <ellipse cx="120" cy="190" rx="10" ry="5" fill="#000000" />
        </svg>
      )}
    </div>
  );
};