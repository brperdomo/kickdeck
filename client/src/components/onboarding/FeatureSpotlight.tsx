import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpeechBubble from './SpeechBubble';
import { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

interface FeatureSpotlightProps {
  /**
   * CSS selector for the element to highlight
   */
  elementSelector: string;
  
  /**
   * Message to display in the spotlight
   */
  message: string;
  
  /**
   * Position of the speech bubble relative to the highlighted element
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Emotion to display on the mascot character
   */
  mascotEmotion?: MascotEmotion;
  
  /**
   * Whether to show the mascot character
   */
  showMascot?: boolean;
  
  /**
   * Callback to close the spotlight
   */
  onClose: () => void;
  
  /**
   * Callback for the primary action button
   */
  onAction?: () => void;
  
  /**
   * Label for the action button
   */
  actionLabel?: string;
  
  /**
   * Whether to automatically focus the action button
   */
  autoFocus?: boolean;
  
  /**
   * Whether to pulse the spotlight
   */
  pulse?: boolean;
  
  /**
   * Padding around the target element in pixels
   */
  padding?: number;
}

/**
 * FeatureSpotlight component highlights a specific element on the page
 * with a spotlight effect and displays a speech bubble with a message.
 */
const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  elementSelector,
  message,
  position = 'bottom',
  mascotEmotion = 'pointing',
  showMascot = true,
  onClose,
  onAction,
  actionLabel = 'Got it',
  autoFocus = true,
  pulse = true,
  padding = 10,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  // Find and measure the target element
  useEffect(() => {
    const targetElement = document.querySelector(elementSelector) as HTMLElement;
    
    if (!targetElement) {
      console.error(`Element not found with selector: ${elementSelector}`);
      return;
    }
    
    // Create spotlight on target element
    const updateTargetRect = () => {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2),
        bottom: rect.bottom + padding,
        right: rect.right + padding,
        x: rect.x - padding,
        y: rect.y - padding,
      });
    };
    
    // Apply highlight class to target element for better pointer events
    targetElement.classList.add('feature-target-highlight');
    
    // Initial measurement
    updateTargetRect();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateTargetRect);
    resizeObserver.observe(targetElement);
    
    // Update on scroll
    window.addEventListener('scroll', updateTargetRect, true);
    window.addEventListener('resize', updateTargetRect);
    
    return () => {
      targetElement.classList.remove('feature-target-highlight');
      resizeObserver.disconnect();
      window.removeEventListener('scroll', updateTargetRect, true);
      window.removeEventListener('resize', updateTargetRect);
    };
  }, [elementSelector, padding]);
  
  // Position the speech bubble relative to the target element
  useEffect(() => {
    if (!targetRect || !bubbleRef.current) return;
    
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = targetRect.top - bubbleRect.height - 20;
        left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
        break;
        
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2);
        left = targetRect.right + 20;
        break;
        
      case 'bottom':
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
        break;
        
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2);
        left = targetRect.left - bubbleRect.width - 20;
        break;
    }
    
    // Ensure the bubble stays within viewport
    if (left < 20) left = 20;
    if (left + bubbleRect.width > windowWidth - 20) left = windowWidth - bubbleRect.width - 20;
    if (top < 20) top = 20;
    if (top + bubbleRect.height > windowHeight - 20) top = windowHeight - bubbleRect.height - 20;
    
    setBubblePosition({ top, left });
  }, [targetRect, position]);
  
  // Handle escape key to close spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // Handle action with both close and callback
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };
  
  if (!targetRect) {
    return null;
  }
  
  return createPortal(
    <div className="feature-spotlight-overlay">
      {/* Spotlight on the feature */}
      <div
        className={`feature-spotlight ${pulse ? 'pulse' : ''}`}
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
      />
      
      {/* Close button */}
      <button className="spotlight-close-button" onClick={onClose}>
        <X size={18} />
      </button>
      
      {/* Speech bubble */}
      <div
        ref={bubbleRef}
        style={{
          position: 'fixed',
          top: bubblePosition.top,
          left: bubblePosition.left,
          zIndex: 1002,
        }}
      >
        <SpeechBubble
          message={message}
          position={position}
          mascotEmotion={mascotEmotion}
          showMascot={showMascot}
          onAction={handleAction}
          actionLabel={actionLabel}
          autoFocus={autoFocus}
        />
      </div>
    </div>,
    document.body
  );
};

export default FeatureSpotlight;