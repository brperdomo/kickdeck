import { useState, useEffect, useCallback } from 'react';

// Define our breakpoints to match Tailwind's default breakpoints
const breakpoints = {
  sm: 640,   // Small devices (phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large devices (large desktops)
  '2xl': 1536, // 2XL screens
};

// Define return type for useBreakpoint
interface BreakpointState {
  isMobile: boolean;    // < md (under 768px)
  isTablet: boolean;    // >= md && < lg (768px - 1023px)
  isDesktop: boolean;   // >= lg (1024px and up)
  isLargeDesktop: boolean; // >= xl (1280px and up)
  width: number;        // current viewport width
  height: number;       // current viewport height
  breakpoint: string;   // current breakpoint name
}

// This hook tracks the viewport dimensions and returns boolean flags for breakpoints
export function useViewport(): BreakpointState {
  // Default state using SSR-safe values (defaulting to desktop)
  const [state, setState] = useState<BreakpointState>({
    isMobile: false, 
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    breakpoint: 'lg'
  });

  // Determine the current breakpoint based on window width
  const calculateBreakpoint = useCallback((width: number): string => {
    if (width < breakpoints.sm) return 'xs';
    if (width < breakpoints.md) return 'sm';
    if (width < breakpoints.lg) return 'md';
    if (width < breakpoints.xl) return 'lg';
    if (width < breakpoints['2xl']) return 'xl';
    return '2xl';
  }, []);

  // Update the state based on current dimensions
  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = calculateBreakpoint(width);
    
    setState({
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      isLargeDesktop: width >= breakpoints.xl,
      width,
      height,
      breakpoint
    });
  }, [calculateBreakpoint]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Initialize state
    updateDimensions();

    // Add event listener
    window.addEventListener('resize', updateDimensions);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  return state;
}

// Custom hook to check if a specific breakpoint is active
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    
    // Update the state initially
    setMatches(media.matches);
    
    // Create a listener function
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    // Add the listener
    media.addEventListener('change', listener);
    
    // Clean up
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

// Helper hooks for specific breakpoints
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

export function useIsPortrait() {
  return useMediaQuery('(orientation: portrait)');
}

export function useIsLandscape() {
  return useMediaQuery('(orientation: landscape)');
}