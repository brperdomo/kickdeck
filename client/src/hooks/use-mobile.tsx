import React, { createContext, useContext, useEffect, useState } from 'react';
import { useViewport } from './use-viewport';

interface MobileContextProps {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

const MobileContext = createContext<MobileContextProps>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLargeDesktop: false,
  orientation: 'landscape'
});

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useViewport();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <MobileContext.Provider
      value={{
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        orientation
      }}
    >
      {children}
    </MobileContext.Provider>
  );
};

export const useMobileContext = () => useContext(MobileContext);

// Optional: Higher-order component for components that need mobile context
export const withMobileContext = <P extends object>(
  Component: React.ComponentType<P & MobileContextProps>
) => {
  return (props: P) => {
    const mobileContext = useMobileContext();
    return <Component {...props} {...mobileContext} />;
  };
};