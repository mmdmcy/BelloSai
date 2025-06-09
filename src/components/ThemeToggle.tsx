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
      className={`p-2.5 rounded-lg transition-colors ${
        isDark 
          ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-purple-200'
      }`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}