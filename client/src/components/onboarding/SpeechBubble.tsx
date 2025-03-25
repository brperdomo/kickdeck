import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { MascotCharacter, MascotEmotion } from './MascotCharacter';
import './onboarding.css';

export interface SpeechBubbleProps {
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  mascotEmotion?: MascotEmotion;
  showMascot?: boolean;
  className?: string;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  position = 'bottom',
  onClose,
  onAction,
  actionLabel = 'Got it',
  mascotEmotion = 'happy',
  showMascot = true,
  className,
}) => {
  // Calculate which side to place the speech bubble pointer
  const getBubblePointerClass = () => {
    switch (position) {
      case 'top': return 'bubble-pointer-bottom';
      case 'right': return 'bubble-pointer-left';
      case 'bottom': return 'bubble-pointer-top';
      case 'left': return 'bubble-pointer-right';
      default: return 'bubble-pointer-top';
    }
  };

  // Determine the mascot position based on bubble position
  const getMascotPosition = () => {
    switch (position) {
      case 'top': return 'bottom-0 right-0 translate-y-3/4';
      case 'right': return 'bottom-0 left-0 -translate-x-3/4 translate-y-1/4';
      case 'bottom': return 'top-0 right-0 -translate-y-3/4';
      case 'left': return 'bottom-0 right-0 translate-x-3/4 translate-y-1/4';
      default: return 'top-0 right-0 -translate-y-3/4';
    }
  };

  return (
    <div 
      className={cn(
        'relative bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg max-w-sm z-50 fade-in',
        getBubblePointerClass(),
        className
      )}
    >
      {/* Close button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      {/* Content */}
      <div className="mr-6 mb-2">
        <p className="text-slate-700 dark:text-slate-200 text-sm">{message}</p>
      </div>
      
      {/* Action button */}
      {onAction && (
        <div className="flex justify-end mt-2">
          <Button 
            onClick={onAction}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-auto"
            size="sm"
          >
            {actionLabel}
          </Button>
        </div>
      )}
      
      {/* Mascot character */}
      {showMascot && (
        <div 
          className={cn(
            'absolute w-20 h-20 transform',
            getMascotPosition()
          )}
        >
          <MascotCharacter 
            emotion={mascotEmotion} 
            size="sm" 
            animated={true}
          />
        </div>
      )}
      
      {/* Speech bubble pointer - Created with CSS */}
      <style jsx>{`
        .bubble-pointer-top:after {
          content: '';
          position: absolute;
          top: -10px;
          left: 20px;
          border-width: 0 10px 10px;
          border-style: solid;
          border-color: transparent transparent white;
        }
        
        .bubble-pointer-right:after {
          content: '';
          position: absolute;
          right: -10px;
          top: 20px;
          border-width: 10px 0 10px 10px;
          border-style: solid;
          border-color: transparent transparent transparent white;
        }
        
        .bubble-pointer-bottom:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 20px;
          border-width: 10px 10px 0;
          border-style: solid;
          border-color: white transparent transparent;
        }
        
        .bubble-pointer-left:after {
          content: '';
          position: absolute;
          left: -10px;
          top: 20px;
          border-width: 10px 10px 10px 0;
          border-style: solid;
          border-color: transparent white transparent transparent;
        }
        
        .dark .bubble-pointer-top:after {
          border-color: transparent transparent rgb(30, 41, 59);
        }
        
        .dark .bubble-pointer-right:after {
          border-color: transparent transparent transparent rgb(30, 41, 59);
        }
        
        .dark .bubble-pointer-bottom:after {
          border-color: rgb(30, 41, 59) transparent transparent;
        }
        
        .dark .bubble-pointer-left:after {
          border-color: transparent rgb(30, 41, 59) transparent transparent;
        }
      `}</style>
    </div>
  );
};

export default SpeechBubble;