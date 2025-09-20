import { Theme } from '../types/app';

export const AVAILABLE_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Modern Purple',
    description: 'The classic BelloSai look with purple gradients',
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    backgroundColor: '#f9fafb',
    textColor: '#1f2937',
    accentColors: ['#8b5cf6', '#d946ef'],
    gradientEnabled: false,
    fontFamily: 'Inter',
    borderRadius: '0.75rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#f9fafb',
      textColor: '#1f2937',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#111827',
      textColor: '#f9fafb',
      surfaceColor: '#1f2937'
    }
  },
  {
    id: 'glass-night',
    name: 'Glass Night',
    description: 'Crisp black/white base with strong purple contrast. No gradients by default.',
    primaryColor: '#7c3aed',
    secondaryColor: '#7c3aed',
    backgroundColor: '#111827',
    textColor: '#e5e7eb',
    accentColors: ['#7c3aed'],
    gradientEnabled: false,
    fontFamily: 'Inter, system-ui',
    borderRadius: '1.25rem',
    shadows: true,
    glassEffect: true,
    retroMode: false,
    light: {
      backgroundColor: '#f9fafb',
      textColor: '#1f2937',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#111827',
      textColor: '#e5e7eb',
      surfaceColor: '#1f2937'
    }
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Elegant glass effects with modern translucent design',
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    backgroundColor: 'linear-gradient(135deg, #a7f3d0 0%, #7dd3fc 35%, #93c5fd 100%)',
    textColor: '#0f172a',
    accentColors: ['#06b6d4', '#0891b2', '#0e7490', '#67e8f9'],
    gradientEnabled: true,
    fontFamily: 'SF Pro Display, -apple-system, system-ui',
    borderRadius: '1.25rem',
    shadows: true,
    glassEffect: true,
    retroMode: false,
    light: {
      backgroundColor: 'linear-gradient(135deg, #a7f3d0 0%, #7dd3fc 35%, #93c5fd 100%)',
      textColor: '#0f172a',
      surfaceColor: 'rgba(255, 255, 255, 0.7)'
    },
    dark: {
      backgroundColor: 'linear-gradient(135deg, #1e293b 0%, #0f172a 35%, #1e3a8a 100%)',
      textColor: '#f1f5f9',
      surfaceColor: 'rgba(30, 41, 59, 0.7)'
    }
  },
  {
    id: 'frutiger-aero',
    name: 'Cloud Nine',
    description: 'Airy and translucent with soft blues and nature vibes',
    primaryColor: '#0ea5e9',
    secondaryColor: '#06b6d4',
    backgroundColor: '#f0f9ff',
    textColor: '#0f172a',
    accentColors: ['#38bdf8', '#22d3ee', '#67e8f9'],
    gradientEnabled: true,
    fontFamily: 'SF Pro Display, system-ui',
    borderRadius: '1rem',
    shadows: true,
    glassEffect: true,
    retroMode: false,
    light: {
      backgroundColor: '#f0f9ff',
      textColor: '#0f172a',
      surfaceColor: 'rgba(255, 255, 255, 0.8)'
    },
    dark: {
      backgroundColor: '#0c1e2c',
      textColor: '#e0f2fe',
      surfaceColor: 'rgba(12, 30, 44, 0.8)'
    }
  },
  {
    id: 'vista-glass',
    name: 'Vista Elegance',
    description: 'Sophisticated glass effects with subtle animations',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    accentColors: ['#2563eb', '#60a5fa', '#93c5fd'],
    gradientEnabled: true,
    fontFamily: 'Segoe UI, system-ui',
    borderRadius: '0.5rem',
    shadows: true,
    glassEffect: true,
    retroMode: false,
    light: {
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      surfaceColor: 'rgba(255, 255, 255, 0.7)'
    },
    dark: {
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      surfaceColor: 'rgba(15, 23, 42, 0.7)'
    }
  },
  {
    id: 'retro-computing',
    name: 'Terminal Classic',
    description: 'Nostalgic computing with monospace fonts and sharp edges',
    primaryColor: '#22c55e',
    secondaryColor: '#16a34a',
    backgroundColor: '#0a0a0a',
    textColor: '#00ff00',
    accentColors: ['#00ff00', '#ffff00', '#00ffff'],
    gradientEnabled: false,
    fontFamily: 'Courier New, monospace',
    borderRadius: '0',
    shadows: false,
    glassEffect: false,
    retroMode: true,
    light: {
      backgroundColor: '#000000',
      textColor: '#00ff00',
      surfaceColor: '#111111'
    },
    dark: {
      backgroundColor: '#0a0a0a',
      textColor: '#00ff00',
      surfaceColor: '#111111'
    }
  },
  {
    id: 'cupertino',
    name: 'Cupertino Style',
    description: 'Clean and minimal with system-inspired design',
    primaryColor: '#007aff',
    secondaryColor: '#5ac8fa',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColors: ['#007aff', '#5ac8fa', '#ff3b30'],
    gradientEnabled: false,
    fontFamily: 'SF Pro Display, -apple-system, system-ui',
    borderRadius: '0.875rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      surfaceColor: '#f8fafc'
    },
    dark: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      surfaceColor: '#2a2a2a'
    }
  },
  {
    id: 'synthwave',
    name: 'Neon Dreams',
    description: 'Retro-futuristic with vibrant neons and dark backgrounds',
    primaryColor: '#ff0080',
    secondaryColor: '#00ffff',
    backgroundColor: '#0d1117',
    textColor: '#ffffff',
    accentColors: ['#ff0080', '#00ffff', '#ff6b00', '#8000ff'],
    gradientEnabled: true,
    fontFamily: 'Orbitron, monospace',
    borderRadius: '0.25rem',
    shadows: true,
    glassEffect: false,
    retroMode: true,
    light: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      surfaceColor: '#2a2a2a'
    },
    dark: {
      backgroundColor: '#0d1117',
      textColor: '#ffffff',
      surfaceColor: '#1a1a1a'
    }
  },
  {
    id: 'nature-green',
    name: 'Forest Zen',
    description: 'Calming greens inspired by nature and sustainability',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    backgroundColor: '#f0fdf4',
    textColor: '#064e3b',
    accentColors: ['#059669', '#10b981', '#34d399'],
    gradientEnabled: true,
    fontFamily: 'Inter, system-ui',
    borderRadius: '1rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#f0fdf4',
      textColor: '#064e3b',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#064e3b',
      textColor: '#d1fae5',
      surfaceColor: '#065f46'
    }
  },
  {
    id: 'warm-sunset',
    name: 'Golden Hour',
    description: 'Warm oranges and reds like a beautiful sunset',
    primaryColor: '#ea580c',
    secondaryColor: '#f97316',
    backgroundColor: '#fff7ed',
    textColor: '#9a3412',
    accentColors: ['#ea580c', '#f97316', '#fb923c'],
    gradientEnabled: true,
    fontFamily: 'Inter, system-ui',
    borderRadius: '0.75rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#fff7ed',
      textColor: '#9a3412',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#451a03',
      textColor: '#fed7aa',
      surfaceColor: '#7c2d12'
    }
  },
  {
    id: 'genie-dark',
    name: 'Genie Dark',
    description: 'Deep black UI with vibrant emerald accents (mobile-web parity)',
    primaryColor: '#22c55e',
    secondaryColor: '#86efac',
    backgroundColor: '#0b0f0c',
    textColor: '#e5e7eb',
    accentColors: ['#22c55e', '#16a34a', '#86efac', '#14532d'],
    gradientEnabled: false,
    fontFamily: 'Inter, system-ui',
    borderRadius: '0.875rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#f0fdf4',
      textColor: '#064e3b',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#0b0f0c',
      textColor: '#e5e7eb',
      surfaceColor: '#14532d'
    }
  },
  {
    id: 'aurora-light',
    name: 'Aurora Light',
    description: 'Minimal white UI with subtle gray bubbles and clean typography',
    primaryColor: '#111827',
    secondaryColor: '#6b7280',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    accentColors: ['#0ea5e9', '#10a37f', '#9ca3af'],
    gradientEnabled: false,
    fontFamily: 'SF Pro Display, -apple-system, system-ui',
    borderRadius: '1rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      surfaceColor: '#f8fafc'
    },
    dark: {
      backgroundColor: '#111827',
      textColor: '#f9fafb',
      surfaceColor: '#1f2937'
    }
  },
  {
    id: 'app-store-neo',
    name: 'App Store Neo',
    description: 'Modern Apple-style dark UI with emerald highlights and smooth pill surfaces',
    primaryColor: '#10b981',
    secondaryColor: '#22d3ee',
    backgroundColor: 'linear-gradient(135deg, #0b1f1b 0%, #071611 55%, #05211a 100%)',
    textColor: '#e5e7eb',
    accentColors: ['#10b981', '#34d399', '#22d3ee', '#111827'],
    gradientEnabled: true,
    fontFamily: 'SF Pro Display, -apple-system, system-ui',
    borderRadius: '1.25rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 55%, #d1fae5 100%)',
      textColor: '#064e3b',
      surfaceColor: 'rgba(255, 255, 255, 0.7)'
    },
    dark: {
      backgroundColor: 'linear-gradient(135deg, #0b1f1b 0%, #071611 55%, #05211a 100%)',
      textColor: '#e5e7eb',
      surfaceColor: 'rgba(11, 31, 27, 0.7)'
    }
  },
  {
    id: 'obsidian-dark',
    name: 'Obsidian Dark',
    description: 'Flat dark UI with solid header bar and subtle grays like the screenshot',
    primaryColor: '#202123',
    secondaryColor: '#3f4043',
    backgroundColor: '#0e0f10',
    textColor: '#e5e7eb',
    accentColors: ['#6b7280', '#9ca3af', '#60a5fa'],
    gradientEnabled: false,
    fontFamily: 'Inter, system-ui',
    borderRadius: '0.5rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#f9fafb',
      textColor: '#111827',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#0e0f10',
      textColor: '#e5e7eb',
      surfaceColor: '#1f2937'
    }
  },
  {
    id: 'midnight-flat',
    name: 'Midnight Flat',
    description: 'Minimal, flat dark theme with solid top bar and discrete borders',
    primaryColor: '#202123',
    secondaryColor: '#2f3134',
    backgroundColor: '#0e0f10',
    textColor: '#e5e7eb',
    accentColors: ['#10a37f', '#8ab4f8', '#9ca3af'],
    gradientEnabled: false,
    fontFamily: 'Inter, system-ui',
    borderRadius: '0.5rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#f9fafb',
      textColor: '#111827',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#0e0f10',
      textColor: '#e5e7eb',
      surfaceColor: '#1f2937'
    }
  },
  {
    id: 'sonnet-elegant',
    name: 'Sonnet Elegant',
    description: 'Warm dark theme with elegant serif headings and subtle accents',
    primaryColor: '#2a2b2e',
    secondaryColor: '#3b3c40',
    backgroundColor: '#0f0f0f',
    textColor: '#e7e5e4',
    accentColors: ['#e38b5b', '#7bd4c9', '#c4b5a5'],
    gradientEnabled: false,
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
    borderRadius: '0.875rem',
    shadows: true,
    glassEffect: false,
    retroMode: false,
    light: {
      backgroundColor: '#fafaf9',
      textColor: '#1c1917',
      surfaceColor: '#ffffff'
    },
    dark: {
      backgroundColor: '#0f0f0f',
      textColor: '#e7e5e4',
      surfaceColor: '#1c1917'
    }
  }
];




