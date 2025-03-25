import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { MascotCharacter } from './MascotCharacter';
import SpeechBubble from './SpeechBubble';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';

interface FeatureSpotlightProps {
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  mascotEmotion?: 'happy' | 'excited' | 'thinking' | 'pointing' | 'waving';
  show: boolean;
  onClose: () => void;
  onNext?: () => void;
  showMascot?: boolean;
  className?: string;
  step?: number;
  totalSteps?: number;
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  targetSelector,
  title,
  description,
  position = 'bottom',
  mascotEmotion = 'pointing',
  show,
  onClose,
  onNext,
  showMascot = true,
  className,
  step,
  totalSteps,
}) => {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Initialize portal element
  useEffect(() => {
    let el = document.getElementById('spotlight-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'spotlight-portal';
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100vw';
      el.style.height = '100vh';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '100';
      document.body.appendChild(el);
    }
    setPortalElement(el);
  }, []);

  // Position spotlight relative to target element
  useEffect(() => {
    if (!show) return;

    const target = document.querySelector(targetSelector) as HTMLElement;
    if (!target) {
      console.warn(`Target element not found: ${targetSelector}`);
      return;
    }

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updatePosition();
    
    // Highlight target with a pulse effect
    target.classList.add('spotlight-target');
    
    // Update position on resize
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      target.classList.remove('spotlight-target');
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [show, targetSelector]);

  // Adjust tooltip position based on target position
  useEffect(() => {
    if (!spotlightRef.current || !show) return;
    
    const tooltipRect = spotlightRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Check if tooltip would go off-screen and adjust position if needed
    let newPosition = position;
    
    if (position === 'bottom' && coords.top + coords.height + tooltipHeight > windowHeight) {
      newPosition = 'top';
    } else if (position === 'top' && coords.top - tooltipHeight < 0) {
      newPosition = 'bottom';
    } else if (position === 'right' && coords.left + coords.width + tooltipWidth > windowWidth) {
      newPosition = 'left';
    } else if (position === 'left' && coords.left - tooltipWidth < 0) {
      newPosition = 'right';
    }
    
    // Apply the position as a data attribute
    spotlightRef.current.setAttribute('data-position', newPosition);
  }, [coords, position, show]);

  if (!show || !portalElement) return null;

  // Calculate position based on target and specified position
  const getPositionStyles = () => {
    const margin = 12; // Distance from target element
    
    switch (position) {
      case 'top':
        return {
          top: coords.top - margin,
          left: coords.left + coords.width / 2,
          transform: 'translate(-50%, -100%)',
        };
      case 'right':
        return {
          top: coords.top + coords.height / 2,
          left: coords.left + coords.width + margin,
          transform: 'translateY(-50%)',
        };
      case 'left':
        return {
          top: coords.top + coords.height / 2,
          left: coords.left - margin,
          transform: 'translate(-100%, -50%)',
        };
      case 'bottom':
      default:
        return {
          top: coords.top + coords.height + margin,
          left: coords.left + coords.width / 2,
          transform: 'translateX(-50%)',
        };
    }
  };

  return createPortal(
    <div
      ref={spotlightRef}
      className={cn(
        'fixed max-w-sm z-50 animate-fade-in pointer-events-auto',
        className
      )}
      style={getPositionStyles()}
      data-position={position}
    >
      <div className="flex">
        {showMascot && position === 'left' && (
          <div className="mr-2">
            <MascotCharacter emotion={mascotEmotion} size="sm" />
          </div>
        )}
        
        <SpeechBubble position={position} className="bg-white shadow-lg dark:bg-slate-900">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{description}</p>
          
          <div className="flex justify-between items-center">
            {step && totalSteps ? (
              <div className="text-xs text-gray-500">
                Step {step} of {totalSteps}
              </div>
            ) : (
              <div></div>
            )}
            
            {onNext && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={onNext}
                className="bg-green-600 hover:bg-green-700"
              >
                Next <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </SpeechBubble>
        
        {showMascot && position !== 'left' && (
          <div className="ml-2">
            <MascotCharacter emotion={mascotEmotion} size="sm" />
          </div>
        )}
      </div>
    </div>,
    portalElement
  );
};

export default FeatureSpotlight;