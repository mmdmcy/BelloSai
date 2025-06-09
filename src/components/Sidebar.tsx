/**
 * Sidebar Component
 * 
 * This component renders the left sidebar of the application containing:
 * - Chat history list
 * - Collapsible functionality for space optimization
 * - Support for detached mode where main components are separate
 * 
 * Features:
 * - Responsive design with collapse/expand functionality
 * - Customizable theming and colors
 * - Chat history organization by time periods
 * - Detached mode support for maximum customization
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface SidebarProps {
  isDark: boolean;
  onAccountClick: () => void;
  customization: CustomizationSettings;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSendMessage: (message: string) => void;
  onNewGame: () => void;
  detachedMode?: boolean; // New prop to indicate if components are detached
}

export default function Sidebar({ 
  isDark, 
  onAccountClick, 
  customization, 
  isCollapsed, 
  onToggleCollapse,
  onSendMessage,
  onNewGame,
  detachedMode = false
}: SidebarProps) {

  /**
   * Helper function to get appropriate text color in dark mode
   * Adapts colors based on theme and customization settings
   */
  const getTextColor = (baseColor: string, isDark: boolean) => {
    if (isDark) {
      // In dark mode, use a lighter version of the custom color or fallback to gray
      return customization.primaryColor !== '#7c3aed' ? customization.secondaryColor : '#9CA3AF';
    }
    return baseColor;
  };

  /**
   * Helper function for secondary text colors
   */
  const getSecondaryTextColor = (baseColor: string, isDark: boolean) => {
    if (isDark) {
      // In dark mode, use secondary color if it's custom, otherwise use gray
      return customization.secondaryColor !== '#a855f7' ? customization.secondaryColor + 'CC' : '#9CA3AF';
    }
    return baseColor;
  };

  // Collapsed sidebar - only show toggle button
  if (isCollapsed) {
    return (
      <div 
        className={`w-full h-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex flex-col items-center py-4 gap-4`}
        style={{
          background: customization.gradientEnabled && !isDark 
            ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
            : undefined
        }}
      >
        {/* Expand Button */}
        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg transition-colors ${
            isDark 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-purple-200'
          }`}
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Full sidebar layout - simplified when in detached mode
  return (
    <div 
      className={`w-full h-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex flex-col`}
      style={{
        background: customization.gradientEnabled && !isDark 
          ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
          : undefined
      }}
    >
      {/* Header Section - Only show collapse button in detached mode */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-purple-100'} flex items-center justify-end`}>
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark 
              ? 'text-gray-400 hover:bg-gray-700 hover:text-white' 
              : 'text-gray-600 hover:bg-purple-100 hover:text-purple-700'
          }`}
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Chat History Section */}
      <div className="px-4 pb-4 flex-1">
        {/* Today Section */}
        <div className={`text-xs font-medium mb-2`}
             style={{ 
               fontFamily: customization.fontFamily,
               color: getSecondaryTextColor(customization.primaryColor + 'CC', isDark)
             }}>
          Today
        </div>
        <button 
          className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
            isDark 
              ? 'bg-gray-700 text-white' 
              : 'text-purple-800'
          }`}
          style={{ 
            background: isDark 
              ? undefined 
              : customization.gradientEnabled
                ? `linear-gradient(135deg, ${customization.secondaryColor}40, ${customization.primaryColor}20)`
                : customization.secondaryColor + '40',
            fontFamily: customization.fontFamily,
            color: isDark 
              ? (customization.secondaryColor !== '#a855f7' ? customization.secondaryColor : undefined)
              : customization.primaryColor
          }}
        >
          Greeting
        </button>
        
        {/* Last 30 Days Section */}
        <div className={`text-xs font-medium mb-2 mt-4`}
             style={{ 
               fontFamily: customization.fontFamily,
               color: getSecondaryTextColor(customization.primaryColor + 'CC', isDark)
             }}>
          Last 30 Days
        </div>
        <button 
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            isDark 
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
              : 'hover:text-purple-800'
          }`}
          style={{ 
            fontFamily: customization.fontFamily,
            color: getTextColor(customization.primaryColor + 'CC', isDark)
          }}
          onMouseEnter={(e) => {
            if (!isDark) {
              e.currentTarget.style.backgroundColor = customization.gradientEnabled
                ? `linear-gradient(135deg, ${customization.primaryColor}20, ${customization.secondaryColor}10)`
                : customization.primaryColor + '20';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDark) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          AI Explained
        </button>
      </div>
    </div>
  );
}