import { createContext, useState, useEffect, useContext, useCallback, FC, ReactNode } from 'react';
import { AVAILABLE_THEMES } from '../theme/registry';

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
  availableThemes: typeof AVAILABLE_THEMES;
  getTheme: (themeId: string) => typeof AVAILABLE_THEMES[0] | undefined;
  applyTheme: (themeId: string, isDark?: boolean) => void;
  isDark: boolean;
  toggleTheme: () => void;
  hasGlassEffect: () => boolean;
  getCurrentColors: () => {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    surface: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>('default');
  const [isDark, setIsDark] = useState(false);

  const applyTheme = useCallback((themeId: string, forceDark?: boolean) => {
    const selectedTheme = AVAILABLE_THEMES.find(t => t.id === themeId) || AVAILABLE_THEMES[0];
    const root = window.document.documentElement;

    // Determine if we should use dark mode
    const useDarkMode = forceDark !== undefined ? forceDark : isDark;

    // Get colors based on current mode
    const colors = useDarkMode && selectedTheme.dark
      ? {
          primary: selectedTheme.primaryColor,
          secondary: selectedTheme.secondaryColor,
          background: selectedTheme.dark.backgroundColor,
          text: selectedTheme.dark.textColor,
          accent: selectedTheme.accentColors[0] || selectedTheme.primaryColor,
          surface: selectedTheme.dark.surfaceColor
        }
      : {
          primary: selectedTheme.primaryColor,
          secondary: selectedTheme.secondaryColor,
          background: selectedTheme.light?.backgroundColor || selectedTheme.backgroundColor,
          text: selectedTheme.light?.textColor || selectedTheme.textColor,
          accent: selectedTheme.accentColors[0] || selectedTheme.primaryColor,
          surface: selectedTheme.light?.surfaceColor || '#ffffff'
        };

    // Apply CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--font-family', selectedTheme.fontFamily);
    root.style.setProperty('--border-radius', selectedTheme.borderRadius);

    // Set dark mode class
    if (useDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set glassmorphism attribute
    if (selectedTheme.glassEffect) {
      root.setAttribute('data-glassmorphism', 'true');
    } else {
      root.removeAttribute('data-glassmorphism');
    }

    // Set retro mode attribute
    if (selectedTheme.retroMode) {
      root.setAttribute('data-retro', 'true');
    } else {
      root.removeAttribute('data-retro');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(theme, newIsDark);
    localStorage.setItem('isDark', newIsDark.toString());
  }, [theme, isDark, applyTheme]);

  const setTheme = useCallback((themeId: string) => {
    localStorage.setItem('theme', themeId);
    setThemeState(themeId);
    applyTheme(themeId, isDark);
  }, [applyTheme, isDark]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'default';
    const savedIsDark = localStorage.getItem('isDark') === 'true';
    setThemeState(savedTheme);
    setIsDark(savedIsDark);
    applyTheme(savedTheme, savedIsDark);
  }, [applyTheme]);

  const getTheme = (themeId: string) => {
    return AVAILABLE_THEMES.find(t => t.id === themeId);
  };

  const hasGlassEffect = () => {
    const currentTheme = getTheme(theme);
    return currentTheme?.glassEffect || false;
  };

  const getCurrentColors = useCallback(() => {
    const selectedTheme = AVAILABLE_THEMES.find(t => t.id === theme) || AVAILABLE_THEMES[0];
    const useDarkMode = isDark;

    if (useDarkMode && selectedTheme.dark) {
      return {
        primary: selectedTheme.primaryColor,
        secondary: selectedTheme.secondaryColor,
        background: selectedTheme.dark.backgroundColor,
        text: selectedTheme.dark.textColor,
        accent: selectedTheme.accentColors[0] || selectedTheme.primaryColor,
        surface: selectedTheme.dark.surfaceColor
      };
    } else {
      return {
        primary: selectedTheme.primaryColor,
        secondary: selectedTheme.secondaryColor,
        background: selectedTheme.light?.backgroundColor || selectedTheme.backgroundColor,
        text: selectedTheme.light?.textColor || selectedTheme.textColor,
        accent: selectedTheme.accentColors[0] || selectedTheme.primaryColor,
        surface: selectedTheme.light?.surfaceColor || '#ffffff'
      };
    }
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      availableThemes: AVAILABLE_THEMES,
      getTheme,
      applyTheme,
      isDark,
      toggleTheme,
      hasGlassEffect,
      getCurrentColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
