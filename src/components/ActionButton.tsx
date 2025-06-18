/**
 * ActionButton Component
 * 
 * A reusable button component for action items on the main page.
 * Features customizable styling based on theme and user preferences.
 * 
 * Features:
 * - Icon and label display
 * - Theme-aware styling (light/dark mode)
 * - Customizable colors and gradients
 * - Hover effects with smooth transitions
 * - Responsive design
 */

import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  isDark: boolean;
  customization: CustomizationSettings;
}

export default function ActionButton({ icon: Icon, label, isDark, customization }: ActionButtonProps) {
  return (
    <button 
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors ${
        isDark 
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' 
          : 'hover:text-purple-800'
      }`}
      style={{ 
        fontFamily: customization.fontFamily,
        // Apply custom colors and gradients for light mode
        background: isDark 
          ? undefined 
          : customization.gradientEnabled
            ? `linear-gradient(135deg, ${customization.primaryColor}20, ${customization.secondaryColor}10)`
            : customization.primaryColor + '20',
        color: isDark ? undefined : customization.primaryColor
      }}
      // Dynamic hover effects for light mode
      onMouseEnter={(e) => {
        if (!isDark) {
          e.currentTarget.style.background = customization.gradientEnabled
            ? `linear-gradient(135deg, ${customization.primaryColor}30, ${customization.secondaryColor}20)`
            : customization.primaryColor + '30';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDark) {
          e.currentTarget.style.background = customization.gradientEnabled
            ? `linear-gradient(135deg, ${customization.primaryColor}20, ${customization.secondaryColor}10)`
            : customization.primaryColor + '20';
        }
      }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
