import { useState, useEffect, useMemo } from "react";
import { useViewport, useIsMobileDevice, useIsIOS } from "./use-viewport";

// Breakpoint sizes for responsive design
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Common device sizes for reference
const deviceSizes = {
  // Phones
  iPhone5: { width: 320, height: 568 },
  iPhone6: { width: 375, height: 667 },
  iPhone8Plus: { width: 414, height: 736 },
  iPhoneX: { width: 375, height: 812 },
  iPhone12Pro: { width: 390, height: 844 },
  iPhone12ProMax: { width: 428, height: 926 },
  
  // Common Android phones
  samsungS8: { width: 360, height: 740 },
  pixel4: { width: 393, height: 830 },
  pixel6Pro: { width: 412, height: 915 },
  
  // Tablets
  iPad: { width: 768, height: 1024 },
  iPadPro: { width: 1024, height: 1366 },
  
  // Other common screens
  smallLaptop: { width: 1280, height: 800 },
  standardLaptop: { width: 1366, height: 768 },
  largeLaptop: { width: 1440, height: 900 },
  desktopHD: { width: 1920, height: 1080 }
};

/**
 * Generates the classes needed for a responsive container
 * @param includeMargin Whether to include auto margins (default: true)
 * @returns Tailwind classes for a responsive container
 */
export function responsiveContainerClasses(includeMargin = true) {
  return [
    "w-full",
    "px-4 sm:px-6 lg:px-8",
    includeMargin ? "mx-auto" : "",
    "max-w-7xl"
  ].filter(Boolean).join(" ");
}

/**
 * Hook for responsive breakpoint detection
 * @returns Object with boolean flags for each breakpoint
 */
export function useBreakpoint() {
  const { width } = useViewport();
  
  const breakpointsState = useMemo(() => {
    return {
      // Boolean flags for exact breakpoints
      isXs: width < breakpoints.sm,
      isSm: width >= breakpoints.sm && width < breakpoints.md,
      isMd: width >= breakpoints.md && width < breakpoints.lg,
      isLg: width >= breakpoints.lg && width < breakpoints.xl,
      isXl: width >= breakpoints.xl && width < breakpoints['2xl'],
      is2Xl: width >= breakpoints['2xl'],
      
      // Boolean flags for "up" breakpoints (at least this size)
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      
      // Boolean flags for minimum size
      smUp: width >= breakpoints.sm,
      mdUp: width >= breakpoints.md,
      lgUp: width >= breakpoints.lg,
      xlUp: width >= breakpoints.xl,
      '2xlUp': width >= breakpoints['2xl'],
      
      // Current active breakpoint name
      current: width < breakpoints.sm 
        ? 'xs' 
        : width < breakpoints.md 
          ? 'sm' 
          : width < breakpoints.lg 
            ? 'md' 
            : width < breakpoints.xl 
              ? 'lg' 
              : width < breakpoints['2xl'] 
                ? 'xl' 
                : '2xl'
    };
  }, [width]);
  
  return breakpointsState;
}

/**
 * Hook for checking if the current device requires touch-optimized UI
 * @returns Boolean indicating if the device is touch-first
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    // Check for touch capability
    const hasTouch = 'ontouchstart' in window || 
                    navigator.maxTouchPoints > 0 ||
                    (navigator as any).msMaxTouchPoints > 0;
    
    setIsTouch(hasTouch);
    
    // Add CSS class to document root for styling
    if (hasTouch) {
      document.documentElement.classList.add('touch-device');
    } else {
      document.documentElement.classList.remove('touch-device');
    }
    
    return () => {
      document.documentElement.classList.remove('touch-device');
    };
  }, []);
  
  return isTouch;
}

/**
 * Comprehensive hook that returns all mobile-related information
 * @returns Object with all mobile information and utilities
 */
export function useMobileContext() {
  const breakpoint = useBreakpoint();
  const viewport = useViewport();
  const isMobileDevice = useIsMobileDevice();
  const isTouch = useTouchDevice();
  const isIOS = useIsIOS();
  
  // Determine whether to activate mobile optimizations
  const shouldUseMobileUI = breakpoint.isMobile || isMobileDevice;
  
  // Get most appropriate container class
  const getContainerClass = (includeMargin = true) => {
    return responsiveContainerClasses(includeMargin);
  };
  
  // Check if current viewport matches a common device
  const deviceMatch = useMemo(() => {
    const { width, height } = viewport;
    const matches = Object.entries(deviceSizes).filter(([, size]) => {
      // Allow for a small margin of error (browser UI elements, etc)
      const widthMatch = Math.abs(width - size.width) <= 20;
      const heightMatch = Math.abs(height - size.height) <= 50;
      return widthMatch && heightMatch;
    });
    
    return matches.length > 0 ? matches[0][0] : null;
  }, [viewport.width, viewport.height]);
  
  return {
    // Breakpoint information
    ...breakpoint,
    
    // Viewport information
    viewport,
    
    // Device detection
    isMobileDevice,
    isTouch,
    isIOS,
    
    // UI decisions
    shouldUseMobileUI,
    isKeyboardVisible: viewport.isKeyboardVisible,
    
    // Helper utilities
    getContainerClass,
    deviceMatch,
    
    // CSS variables
    setCssVariable: (name: string, value: string) => {
      document.documentElement.style.setProperty(name, value);
    }
  };
}