import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

export const colors = {
  slate: 'hsl(222.2 47.4% 11.2%)',
  red: 'hsl(0 72.2% 50.6%)',
  orange: 'hsl(24.6 95% 53.1%)',
  green: 'hsl(142.1 76.2% 36.3%)',
  blue: 'hsl(221.2 83.2% 53.3%)',
  violet: 'hsl(262.1 83.3% 57.8%)',
} as const;

type ColorName = keyof typeof colors;

export interface Theme {
  variant: 'professional' | 'tint' | 'vibrant';
  primary: string;
  appearance: 'light' | 'dark' | 'system';
  radius: number;
  colors?: {
    [key: string]: string;
  };
}

export interface StyleConfig {
  primary: {
    primary: string;
    secondary: string;
  };
  buttons: {
    buttonDefault: string;
    buttonHover: string;
    buttonActive: string;
  };
  interactive: {
    hoverBackground: string;
    activeBackground: string;
  };
  navigation: {
    navBackground: string;
    navText: string;
    navHover: string;
  };
  adminRoles: {
    superAdmin: string;
    tournamentAdmin: string;
    scoreAdmin: string;
    financeAdmin: string;
  };
}

export function useTheme() {
  const [currentColor, setCurrentColor] = useState<ColorName>('slate');
  const [styleConfig, setStyleConfig] = useState<StyleConfig | null>(null);
  // Default to light mode, only use localStorage if explicitly set by user
  const [currentAppearance, setCurrentAppearance] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage only once on component mount
  useEffect(() => {
    // Only read from localStorage once on initial load
    const savedAppearance = localStorage.getItem('theme-appearance') as 'light' | 'dark';
    if (savedAppearance) {
      setCurrentAppearance(savedAppearance);
    }
  }, []);
  
  useEffect(() => {
    // Check if we're on a registration, auth page, or event page
    const isAuthPage = window.location.pathname.includes('/auth') || 
                        window.location.pathname.includes('/register') || 
                        window.location.pathname.includes('/forgot-password') ||
                        window.location.pathname.includes('/reset-password') ||
                        window.location.pathname.includes('/events/') ||
                        window.location.pathname.includes('/register/event/');
    
    // Set the dark mode class on the document root
    // but only if we're not on an authentication page
    if (currentAppearance === 'dark' && !isAuthPage) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage when changed by user action
    localStorage.setItem('theme-appearance', currentAppearance);
  }, [currentAppearance]);

  const themeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      const response = await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(theme),
      });

      if (!response.ok) {
        throw new Error('Failed to update theme');
      }

      return response.json();
    },
  });

  const styleConfigMutation = useMutation({
    mutationFn: async (config: StyleConfig) => {
      const response = await fetch('/api/admin/styling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to update style configuration');
      }

      return response.json();
    },
  });

  const setColor = useCallback(async (colorName: ColorName | string) => {
    const colorValue = colorName in colors 
      ? colors[colorName as ColorName]
      : colorName;

    setCurrentColor(colorName as ColorName);
    await themeMutation.mutateAsync({
      variant: 'professional',
      primary: colorValue,
      appearance: currentAppearance,
      radius: 0.5,
    });
  }, [themeMutation, currentAppearance]);

  const setAppearance = useCallback(async (appearance: 'light' | 'dark') => {
    setCurrentAppearance(appearance);
    await themeMutation.mutateAsync({
      variant: 'professional',
      primary: colors[currentColor],
      appearance: appearance,
      radius: 0.5,
    });
  }, [themeMutation, currentColor]);

  /**
   * Update theme settings with partial Theme object
   * This implementation avoids hard refreshes by debouncing API calls
   */
  const updateTheme = useCallback(async (themeUpdate: Partial<Theme>) => {
    try {
      // Handle appearance changes locally first (UI updates)
      if (themeUpdate.appearance) {
        // Only accept 'light' or 'dark' for the state (ignore 'system')
        if (themeUpdate.appearance === 'light' || themeUpdate.appearance === 'dark') {
          // Update state and localStorage
          setCurrentAppearance(themeUpdate.appearance);
          localStorage.setItem('theme-appearance', themeUpdate.appearance);
          
          // Check if we're on a registration, auth page, or event page
          const isAuthPage = window.location.pathname.includes('/auth') || 
                             window.location.pathname.includes('/register') || 
                             window.location.pathname.includes('/forgot-password') ||
                             window.location.pathname.includes('/reset-password') ||
                             window.location.pathname.includes('/events/') ||
                             window.location.pathname.includes('/register/event/');
          
          // Apply appearance change to document immediately
          // but only if we're not on an authentication page
          if (themeUpdate.appearance === 'dark' && !isAuthPage) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
      
      // If primary color is specified, update current color in state
      if (themeUpdate.primary) {
        // Check if it's one of our predefined colors or a custom color
        const matchedColor = Object.entries(colors).find(
          ([, value]) => value === themeUpdate.primary
        );
        
        if (matchedColor) {
          setCurrentColor(matchedColor[0] as ColorName);
        }
      }
      
      // Construct complete theme object with existing values + updates
      const updatedTheme: Theme = {
        variant: themeUpdate.variant || 'professional',
        primary: themeUpdate.primary || colors[currentColor],
        appearance: (themeUpdate.appearance === 'light' || themeUpdate.appearance === 'dark') 
          ? themeUpdate.appearance 
          : currentAppearance,
        radius: themeUpdate.radius || 0.5,
      };
      
      // Only call API if we're connected and logged in
      // Use a slight timeout to debounce and avoid quick successive calls
      if (document.cookie.includes('connect.sid')) {
        // Save theme to server in the background and don't wait for it
        setTimeout(() => {
          themeMutation.mutate(updatedTheme);
        }, 300);
      }
      
      // Return immediately after updating the UI, don't wait for API
      return true;
    } catch (error) {
      console.error('Failed to update theme:', error);
      return false;
    }
  }, [themeMutation, currentColor, currentAppearance]);

  const updateStyleConfig = useCallback(async (config: StyleConfig) => {
    setStyleConfig(config);
    await styleConfigMutation.mutateAsync(config);
  }, [styleConfigMutation]);

  return {
    currentColor,
    setColor,
    currentAppearance,
    setAppearance,
    styleConfig,
    updateStyleConfig,
    updateTheme,
    isLoading: themeMutation.isPending || styleConfigMutation.isPending,
    error: themeMutation.error || styleConfigMutation.error,
  };
}