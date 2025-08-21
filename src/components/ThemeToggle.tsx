/**
 * ThemeToggle Component
 * 
 * A simple toggle button for switching between light and dark themes.
 * Uses sun and moon icons to represent the current theme state.
 * Clean design without background colors.
 * 
 * Features:
 * - Visual theme indicators (sun/moon icons)
 * - Smooth hover transitions
 * - Accessible button design
 * - Clean styling without background colors
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2.5 rounded-xl ios-pressable bg-white text-gray-900 hover:bg-white/90 border border-white/70 shadow`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Show sun icon in dark mode (to switch to light), moon icon in light mode (to switch to dark) */}
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
