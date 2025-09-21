import { createContext, useState, useEffect, useContext, useCallback, FC, ReactNode } from 'react';
import { AVAILABLE_THEMES } from '../theme/registry';
import { Theme } from '../types/app';

const isGradientValue = (value?: string) => {
  if (!value) return false;
  return value.startsWith('linear-gradient') || value.startsWith('radial-gradient');
};

const mixColor = (color: string, target: string, amount: number) => {
  const safeAmount = Math.min(100, Math.max(0, amount));
  const complement = 100 - safeAmount;
  return `color-mix(in srgb, ${color} ${safeAmount}%, ${target} ${complement}%)`;
};

const resolveBackgroundTokens = (selectedTheme: Theme, useDarkMode: boolean) => {
  const modePalette = useDarkMode && selectedTheme.dark
    ? selectedTheme.dark
    : selectedTheme.light || {
        backgroundColor: selectedTheme.backgroundColor,
        textColor: selectedTheme.textColor,
        surfaceColor: '#ffffff'
      };

  const backgroundSource = modePalette.backgroundColor || selectedTheme.backgroundColor;
  const surfaceFallback = modePalette.surfaceColor
    || (useDarkMode ? '#111827' : '#ffffff');

  if (isGradientValue(backgroundSource)) {
    return {
      backgroundColor: surfaceFallback,
      backgroundGradient: backgroundSource
    };
  }

  return {
    backgroundColor: backgroundSource,
    backgroundGradient: 'none'
  };
};

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

    const palette = useDarkMode && selectedTheme.dark
      ? selectedTheme.dark
      : selectedTheme.light;

    const surfaceColor = palette?.surfaceColor
      || (useDarkMode
        ? selectedTheme.dark?.surfaceColor
        : selectedTheme.light?.surfaceColor)
      || '#ffffff';

    const { backgroundColor, backgroundGradient } = resolveBackgroundTokens(selectedTheme, useDarkMode);

    const accentColor = selectedTheme.accentColors[0] || selectedTheme.primaryColor;
    const accentSecondary = selectedTheme.accentColors[1] || selectedTheme.secondaryColor || accentColor;
    const accentSoft = mixColor(accentColor, surfaceColor, 18);
    const accentSurface = mixColor(accentColor, backgroundColor, 12);
    const borderAccent = mixColor(accentColor, surfaceColor, 42);
    const ghostSurface = mixColor(surfaceColor, '#000000', useDarkMode ? 12 : 4);
    const softGlow = mixColor(accentSecondary, backgroundColor, 18);
    const textInverse = useDarkMode ? '#f8fafc' : '#101624';

    const colors = {
      primary: selectedTheme.primaryColor,
      secondary: selectedTheme.secondaryColor,
      background: backgroundColor,
      text: palette?.textColor || selectedTheme.textColor,
      accent: selectedTheme.accentColors[0] || selectedTheme.primaryColor,
      surface: surfaceColor
    };

    // Apply CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--color-background-gradient', backgroundGradient);
    root.style.setProperty('--color-accent-strong', accentColor);
    root.style.setProperty('--color-accent-secondary', accentSecondary);
    root.style.setProperty('--color-accent-soft', accentSoft);
    root.style.setProperty('--color-surface-accent', accentSurface);
    root.style.setProperty('--color-border-accent', borderAccent);
    root.style.setProperty('--color-surface-ghost', ghostSurface);
    root.style.setProperty('--color-pulse-glow', softGlow);
    root.style.setProperty('--color-text-inverse', textInverse);
    root.setAttribute('data-theme-ready', 'true');

    root.style.setProperty('--font-family', selectedTheme.fontFamily);
    root.style.setProperty('--border-radius', selectedTheme.borderRadius);

    if (!selectedTheme.shadows) {
      root.style.setProperty('--shadow-elevation', 'none');
      root.style.setProperty('--shadow-soft', 'none');
    } else {
      root.style.setProperty('--shadow-elevation', '0 24px 48px color-mix(in srgb, var(--color-primary) 18%, transparent)');
      root.style.setProperty('--shadow-soft', '0 16px 32px color-mix(in srgb, var(--color-primary) 12%, transparent)');
    }

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
    const { backgroundColor } = resolveBackgroundTokens(selectedTheme, useDarkMode);

    if (useDarkMode && selectedTheme.dark) {
      return {
        primary: selectedTheme.primaryColor,
        secondary: selectedTheme.secondaryColor,
        background: backgroundColor,
        text: selectedTheme.dark.textColor,
        accent: selectedTheme.accentColors[0] || selectedTheme.primaryColor,
        surface: selectedTheme.dark.surfaceColor
      };
    } else {
      return {
        primary: selectedTheme.primaryColor,
        secondary: selectedTheme.secondaryColor,
        background: backgroundColor,
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
