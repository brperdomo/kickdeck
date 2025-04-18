import * as React from "react"

// Breakpoints matching tailwind.config.ts
const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,  // Tablet
  lg: 1024, // Laptop
  xl: 1280, // Desktop
  "2xl": 1536
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.md)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useBreakpoint() {
  // Returns current device breakpoint based on window width
  const [breakpoint, setBreakpoint] = React.useState<keyof typeof BREAKPOINTS | undefined>(undefined)

  React.useEffect(() => {
    const determineBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < BREAKPOINTS.xs) return 'xs'
      if (width < BREAKPOINTS.sm) return 'xs'
      if (width < BREAKPOINTS.md) return 'sm'
      if (width < BREAKPOINTS.lg) return 'md'
      if (width < BREAKPOINTS.xl) return 'lg'
      if (width < BREAKPOINTS["2xl"]) return 'xl'
      return '2xl'
    }

    const handleResize = () => {
      setBreakpoint(determineBreakpoint())
    }
    
    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    breakpoint,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg', 
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
    // Utility functions for showing/hiding elements
    smallerThan: (size: keyof typeof BREAKPOINTS) => {
      const breakpointValue = determineBreakpointValue(breakpoint)
      const compareValue = BREAKPOINTS[size]
      return breakpointValue < compareValue
    },
    largerThan: (size: keyof typeof BREAKPOINTS) => {
      const breakpointValue = determineBreakpointValue(breakpoint)
      const compareValue = BREAKPOINTS[size]
      return breakpointValue >= compareValue
    }
  }
}

// Helper function to determine the numeric value of a breakpoint
function determineBreakpointValue(breakpoint: keyof typeof BREAKPOINTS | undefined): number {
  if (!breakpoint) return 0
  
  switch(breakpoint) {
    case 'xs': return BREAKPOINTS.xs
    case 'sm': return BREAKPOINTS.sm
    case 'md': return BREAKPOINTS.md
    case 'lg': return BREAKPOINTS.lg
    case 'xl': return BREAKPOINTS.xl
    case '2xl': return BREAKPOINTS["2xl"]
    default: return 0
  }
}
