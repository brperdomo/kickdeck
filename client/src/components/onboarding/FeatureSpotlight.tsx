import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import SpeechBubble from './SpeechBubble';
import { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

export interface FeatureSpotlightProps {
  /**
   * CSS selector for the element to highlight
   */
  targetSelector: string;

  /**
   * Content/message to display
   */
  message: string;
  
  /**
   * Position of the tooltip relative to the highlighted element
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Mascot emotion for the attached mascot
   */
  mascotEmotion?: MascotEmotion;
  
  /**
   * Whether to show the mascot with the speech bubble
   */
  showMascot?: boolean;
  
  /**
   * Called when the user closes the spotlight
   */
  onClose?: () => void;
  
  /**
   * Label for the action button
   */
  actionLabel?: string;
  
  /**
   * Called when the user clicks the action button
   */
  onAction?: () => void;
  
  /**
   * Whether to auto-focus the element when spotlight appears
   */
  autoFocus?: boolean;

  /**
   * Whether to click through to the element (pass clicks to the element)
   */
  clickThrough?: boolean;
}

/**
 * A component that highlights a specific UI element and provides a tooltip
 * Used to draw attention to a feature during onboarding
 */
const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  targetSelector,
  message,
  position = 'bottom',
  mascotEmotion = 'neutral',
  showMascot = true,
  onClose,
  actionLabel,
  onAction,
  autoFocus = false,
  clickThrough = false,
}) => {
  // Store the element's position and dimensions
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Create a root element for the portal
  useEffect(() => {
    // Create a div for the spotlight and content
    const div = document.createElement('div');
    document.body.appendChild(div);
    setContent(div);
    
    return () => {
      // Clean up the div on unmount
      document.body.removeChild(div);
    };
  }, []);
  
  // Calculate and update the highlighted element's position
  const updatePosition = useCallback(() => {
    const target = document.querySelector(targetSelector);
    if (target && target instanceof HTMLElement) {
      // Get the bounding rectangle and set it in state
      const rect = target.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
        x: rect.x,
        y: rect.y,
      } as DOMRect);
      
      // Auto-focus the target element if requested
      if (autoFocus) {
        target.focus();
      }
    }
  }, [targetSelector, autoFocus]);
  
  // Update the position when the component mounts and when the window resizes
  useEffect(() => {
    updatePosition();
    
    // Add event listeners for scrolling and resizing
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      // Remove event listeners on cleanup
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);
  
  // Handle click on the overlay background
  const handleOverlayClick = (e: React.MouseEvent) => {
    // If clickThrough is false and the click wasn't on the content, close the spotlight
    if (!clickThrough && contentRef.current && !contentRef.current.contains(e.target as Node) && onClose) {
      onClose();
    }
  };
  
  // Don't render until we have a target and content
  if (!targetRect || !content) {
    return null;
  }
  
  // Calculate the position for the content based on the specified position
  const getContentPosition = () => {
    const buffer = 10; // Add some space between the element and the tooltip
    
    switch (position) {
      case 'top':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.top - buffer,
          transform: 'translate(-50%, -100%)',
        };
      case 'right':
        return {
          left: targetRect.right + buffer,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translateY(-50%)',
        };
      case 'left':
        return {
          left: targetRect.left - buffer,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translate(-100%, -50%)',
        };
      case 'bottom':
      default:
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + buffer,
          transform: 'translateX(-50%)',
        };
    }
  };
  
  // The content to be rendered in the portal
  const portalContent = (
    <div className="spotlight-overlay" onClick={handleOverlayClick}>
      {/* The highlighted cutout area */}
      <div 
        className="spotlight-highlight" 
        style={{
          position: 'absolute',
          top: targetRect.top + 'px',
          left: targetRect.left + 'px',
          width: targetRect.width + 'px',
          height: targetRect.height + 'px',
        }}
      />
      
      {/* The tooltip content */}
      <div 
        ref={contentRef}
        className="spotlight-content" 
        style={getContentPosition()}
      >
        <SpeechBubble
          message={message}
          position={position}
          mascotEmotion={mascotEmotion}
          showMascot={showMascot}
          onAction={onAction}
          actionLabel={actionLabel}
          onClose={onClose}
          width={300}
        />
      </div>
    </div>
  );
  
  // Render the spotlight using a portal
  return createPortal(portalContent, content);
};

export default FeatureSpotlight;