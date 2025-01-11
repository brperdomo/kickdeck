import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

const colors = {
  slate: 'hsl(222.2 47.4% 11.2%)',
  red: 'hsl(0 72.2% 50.6%)',
  orange: 'hsl(24.6 95% 53.1%)',
  green: 'hsl(142.1 76.2% 36.3%)',
  blue: 'hsl(221.2 83.2% 53.3%)',
  violet: 'hsl(262.1 83.3% 57.8%)',
};

type ColorName = keyof typeof colors;

interface Theme {
  variant: 'professional' | 'tint' | 'vibrant';
  primary: string;
  appearance: 'light' | 'dark' | 'system';
  radius: number;
}

export function useTheme() {
  const [currentColor, setCurrentColor] = useState<ColorName>('slate');

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

  const setColor = useCallback(async (colorName: ColorName) => {
    setCurrentColor(colorName);
    await themeMutation.mutateAsync({
      variant: 'professional',
      primary: colors[colorName],
      appearance: 'light',
      radius: 0.5,
    });
  }, [themeMutation]);

  return {
    currentColor,
    setColor,
    isLoading: themeMutation.isPending,
    error: themeMutation.error,
  };
}
