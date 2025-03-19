import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

interface StyleConfig {
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

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "light",
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (theme: Theme) => setTheme(theme),
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  const [styleConfig, setStyleConfig] = useState<StyleConfig | null>(null);

  const themeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      const response = await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
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

  const updateStyleConfig = useCallback(async (config: StyleConfig) => {
    setStyleConfig(config);
    await styleConfigMutation.mutateAsync(config);
  }, [styleConfigMutation]);

  return {
    ...context,
    styleConfig,
    updateStyleConfig,
    isLoading: themeMutation.isPending || styleConfigMutation.isPending,
    error: themeMutation.error || styleConfigMutation.error,
  };
}