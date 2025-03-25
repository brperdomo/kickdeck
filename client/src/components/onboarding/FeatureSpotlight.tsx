import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { MascotEmotion } from './MascotCharacter';
import SpeechBubble from './SpeechBubble';
import './onboarding.css';

export interface FeatureSpotlightProps {
  targetSelector: string;
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  mascotEmotion?: MascotEmotion;
  showMascot?: boolean;
  nextLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  targetSelector,
  message,
  position = 'bottom',
  mascotEmotion = 'pointing',
  showMascot = true,
  nextLabel = 'Next',
  open = true,
  onOpenChange,
  onNext,
  onPrevious,
}) => {
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0 });
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  // Initialize
  useEffect(() => {
    if (!open) {
      setIsVisible(false);
      return;
    }
    
    const element = document.querySelector(targetSelector);
    if (element) {
      setTargetElement(element);
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Calculate spotlight position
      setSpotlightPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
      
      // Calculate speech bubble position based on target and position prop
      calculateBubblePosition(rect, position);
      
      // Add highlight to the target element
      element.classList.add('animate-pulse-highlight');
      
      // Show after brief delay to ensure smooth animation
      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    } else {
      console.warn(`Target element not found: ${targetSelector}`);
      setIsVisible(false);
      if (onOpenChange) onOpenChange(false);
    }
    
    return () => {
      if (element) {
        element.classList.remove('animate-pulse-highlight');
      }
    };
  }, [targetSelector, open, position]);
  
  // Recalculate positions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        
        setSpotlightPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        });
        
        calculateBubblePosition(rect, position);
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [targetElement, position]);
  
  // Handle closing
  const handleClose = () => {
    setIsVisible(false);
    if (onOpenChange) onOpenChange(false);
    
    // Remove highlight from the target element
    if (targetElement) {
      targetElement.classList.remove('animate-pulse-highlight');
    }
  };
  
  // Calculate speech bubble position based on target and position prop
  const calculateBubblePosition = (rect: DOMRect, pos: string) => {
    const padding = 16; // space between spotlight and bubble
    
    let top = 0;
    let left = 0;
    
    switch (pos) {
      case 'top':
        top = rect.top + window.scrollY - padding;
        left = rect.left + window.scrollX + rect.width / 2;
        break;
      case 'right':
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX + rect.width + padding;
        break;
      case 'bottom':
        top = rect.top + window.scrollY + rect.height + padding;
        left = rect.left + window.scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX - padding;
        break;
    }
    
    setBubblePosition({ top, left });
  };
  
  if (!isVisible || !targetRect) {
    return null;
  }
  
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70" 
        onClick={handleClose}
      />
      
      {/* Spotlight cutout */}
      <div
        className="spotlight-cutout absolute"
        style={{
          width: `${targetRect.width + 8}px`,
          height: `${targetRect.height + 8}px`,
          top: `${spotlightPosition.top - 4}px`,
          left: `${spotlightPosition.left - 4}px`,
        }}
      >
        {/* Outline for visible element */}
        <div 
          className="absolute inset-0 border-2 border-green-400 rounded-md"
        />
      </div>
      
      {/* Speech bubble */}
      <div
        className="absolute"
        style={{
          top: bubblePosition.top,
          left: bubblePosition.left,
          transform: `translate(${position === 'left' ? '-100%' : position === 'right' ? '0' : '-50%'}, ${position === 'top' ? '-100%' : position === 'bottom' ? '0' : '-50%'})`,
        }}
      >
        <SpeechBubble
          message={message}
          position={position}
          onClose={handleClose}
          actionLabel={nextLabel}
          onAction={onNext}
          mascotEmotion={mascotEmotion}
          showMascot={showMascot}
        />
      </div>
      
      {/* Skip button */}
      <button 
        className="fixed top-4 right-4 text-white hover:text-gray-300 text-sm"
        onClick={handleClose}
      >
        Skip
      </button>
      
      {/* Navigation buttons */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        {onPrevious && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onPrevious}
            className="bg-white text-gray-800"
          >
            Previous
          </Button>
        )}
        
        {onNext && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={onNext}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {nextLabel} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FeatureSpotlight;