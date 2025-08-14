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
import { CustomizationSettings } from '../types/app';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  isDark: boolean;
  customization: CustomizationSettings;
}

export default function ActionButton({ icon: Icon, label, isDark, customization }: ActionButtonProps) {
  return (
    <button 
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full ios-pressable ${
        isDark 
          ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' 
          : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
      } shadow-sm`}
      style={{ 
        fontFamily: customization.fontFamily,
        // Apply custom colors and gradients for light mode
        background: isDark 
          ? undefined 
          : customization.gradientEnabled
            ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}08)`
            : undefined,
        color: isDark ? undefined : 'inherit'
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
