import { useState, useEffect } from 'react';

/**
 * Viewport dimensions and orientation information
 */
export interface ViewportInfo {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isKeyboardVisible: boolean;
  windowWidth: number;
  windowHeight: number;
  insets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Hook for tracking viewport information including orientation and keyboard visibility
 */
export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation: 'portrait',
    aspectRatio: 0,
    isLandscape: false,
    isPortrait: true,
    isKeyboardVisible: false,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    insets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  useEffect(() => {
    // Initial configuration
    const calculateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const windowHeight = window.outerHeight;
      
      // Estimate if virtual keyboard is visible (iOS, Android)
      // This is not perfect but works for most cases
      const heightRatio = height / windowHeight;
      const isKeyboardProbablyVisible = heightRatio < 0.7;
      
      const orientation = width > height ? 'landscape' : 'portrait';
      const aspectRatio = width / height;

      // Get safe area insets if available (mainly for iOS devices)
      const insets = {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0', 10),
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0', 10),
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0', 10),
      };
      
      setViewport({
        width,
        height,
        orientation,
        aspectRatio,
        isLandscape: orientation === 'landscape',
        isPortrait: orientation === 'portrait',
        isKeyboardVisible: isKeyboardProbablyVisible,
        windowWidth: width,
        windowHeight: window.outerHeight,
        insets,
      });
    };

    // Track the viewport and orientation
    calculateViewport();
    
    // Set CSS variables for viewport dimensions
    document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`);
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    
    // Add safe area insets CSS variables for iOS
    if (typeof CSS !== 'undefined' && CSS.supports('padding-top: env(safe-area-inset-top)')) {
      document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
      document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
    }
    
    // Update on resize and orientation change
    const handleResize = () => {
      calculateViewport();
      document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`);
      document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Special handling for iOS and Android virtual keyboard
    // Focus events can sometimes indicate keyboard visibility
    const handleFocus = () => {
      // Small delay to allow keyboard to show before measuring
      setTimeout(calculateViewport, 300);
    };
    
    const handleBlur = () => {
      // Small delay to allow keyboard to hide before measuring
      setTimeout(calculateViewport, 300);
    };
    
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);
  
  return viewport;
}

/**
 * Estimates whether the browser is running on a mobile device
 */
export function useIsMobileDevice(): boolean {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  
  useEffect(() => {
    // Check for common mobile user agents
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
    
    // Additional check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    setIsMobileDevice(isMobile && hasTouch);
  }, []);
  
  return isMobileDevice;
}

/**
 * Detects iOS devices specifically
 */
export function useIsIOS(): boolean {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    // iOS 13+ detection on iPad
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    
    setIsIOS(isAppleDevice || isIPadOS);
  }, []);
  
  return isIOS;
}