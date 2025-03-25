import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import ReactMarkdown from 'react-markdown';
import './onboarding.css';

interface SpeechBubbleProps {
  /**
   * Content of the speech bubble
   */
  message: string;
  
  /**
   * Position of the mascot character relative to the bubble
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Emotion of the mascot character
   */
  mascotEmotion?: MascotEmotion;
  
  /**
   * Whether to show the mascot character
   */
  showMascot?: boolean;
  
  /**
   * Callback when the action button is clicked
   */
  onAction?: () => void;
  
  /**
   * Label for the action button
   */
  actionLabel?: string;
  
  /**
   * Whether to auto focus the action button
   */
  autoFocus?: boolean;
  
  /**
   * Width of the speech bubble in pixels
   */
  width?: number;
}

/**
 * SpeechBubble component displays a message with a mascot character
 * in a stylized bubble format, supporting markdown content.
 */
const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  position = 'left',
  mascotEmotion = 'neutral',
  showMascot = true,
  onAction,
  actionLabel = 'Got it',
  autoFocus = false,
  width = 280,
}) => {
  // Define bubble tail style based on position
  const getTailStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };
    
    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: '-10px',
          left: '50%',
          marginLeft: '-10px',
          borderWidth: '10px 10px 0 10px',
          borderColor: 'var(--background) transparent transparent transparent',
        };
        
      case 'right':
        return {
          ...baseStyle,
          left: '-10px',
          top: '50%',
          marginTop: '-10px',
          borderWidth: '10px 10px 10px 0',
          borderColor: 'transparent var(--background) transparent transparent',
        };
        
      case 'bottom':
        return {
          ...baseStyle,
          top: '-10px',
          left: '50%',
          marginLeft: '-10px',
          borderWidth: '0 10px 10px 10px',
          borderColor: 'transparent transparent var(--background) transparent',
        };
        
      case 'left':
      default:
        return {
          ...baseStyle,
          right: '-10px',
          top: '50%',
          marginTop: '-10px',
          borderWidth: '10px 0 10px 10px',
          borderColor: 'transparent transparent transparent var(--background)',
        };
    }
  };
  
  return (
    <div 
      className="speech-bubble-container"
      style={{ width: `${width}px` }}
    >
      {/* Mascot Character */}
      {showMascot && (
        <div className={`speech-mascot speech-mascot-${position}`}>
          <MascotCharacter
            emotion={mascotEmotion}
            size="md"
            animate={true}
          />
        </div>
      )}
      
      {/* Speech Bubble */}
      <Card className="relative w-full">
        {/* Bubble Content */}
        <div className="p-4">
          <ReactMarkdown
            children={message}
            className="prose prose-sm max-w-none"
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-primary underline hover:text-primary/80"
                  target="_blank"
                  rel="noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          />
          
          {/* Action Button */}
          {onAction && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                onClick={onAction}
                autoFocus={autoFocus}
              >
                {actionLabel}
              </Button>
            </div>
          )}
        </div>
        
        {/* Bubble Tail */}
        <div style={getTailStyle()} />
      </Card>
    </div>
  );
};

export default SpeechBubble;