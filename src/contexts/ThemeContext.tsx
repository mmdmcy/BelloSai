import { createContext, useState, useEffect, useContext, useCallback, FC, ReactNode } from 'react';

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  font: string;
  glassmorphism: boolean;
  mode: 'light' | 'dark';
}

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  getTheme: (themeId: string) => Theme | undefined;
  applyTheme: (themeId: string) => void;
  isDark: boolean;
  hasGlassEffect: () => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const AVAILABLE_THEMES: Theme[] = [
    {
        id: 'default',
        name: 'Default',
        colors: {
            primary: '#6D28D9',
            secondary: '#4F46E5',
            background: '#F3F4F6',
            text: '#1F2937',
            accent: '#EC4899',
        },
        font: "'Inter', sans-serif",
        glassmorphism: false,
        mode: 'light',
    },
    {
        id: 'dark',
        name: 'Dark Mode',
        colors: {
            primary: '#7C3AED',
            secondary: '#6366F1',
            background: '#111827',
            text: '#F9FAFB',
            accent: '#F472B6',
        },
        font: "'Inter', sans-serif",
        glassmorphism: true,
        mode: 'dark',
    },
    {
        id: 'openai-dark',
        name: 'OpenAI Dark',
        colors: {
            primary: '#10a37f',
            secondary: '#10a37f',
            background: '#202123',
            text: '#ffffff',
            accent: '#10a37f',
        },
        font: "'Sohne', sans-serif",
        glassmorphism: false,
        mode: 'dark',
    }
];

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<string>('default');
  const [isDark, setIsDark] = useState(false);

  const applyTheme = useCallback((themeId: string) => {
    const selectedTheme = AVAILABLE_THEMES.find(t => t.id === themeId) || AVAILABLE_THEMES[0];
    const root = window.document.documentElement;

    Object.entries(selectedTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--font-family', selectedTheme.font);

    if (selectedTheme.mode === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }

    if (selectedTheme.glassmorphism) {
      root.setAttribute('data-glassmorphism', 'true');
    } else {
      root.removeAttribute('data-glassmorphism');
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'default';
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, [applyTheme]);

  const setTheme = (themeId: string) => {
    localStorage.setItem('theme', themeId);
    setThemeState(themeId);
    applyTheme(themeId);
  };

  const getTheme = (themeId: string) => {
    return AVAILABLE_THEMES.find(t => t.id === themeId);
  };

  const hasGlassEffect = () => {
    const currentTheme = getTheme(theme);
    return currentTheme?.glassmorphism || false;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: AVAILABLE_THEMES, getTheme, applyTheme, isDark, hasGlassEffect }}>
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
