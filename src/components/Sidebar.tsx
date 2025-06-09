/**
 * Sidebar Component
 * 
 * This component renders the left sidebar of the application containing:
 * - Application branding and logo
 * - New chat button
 * - Search functionality for chat history
 * - Chat history list
 * - User account information
 * - Collapsible functionality for space optimization
 * 
 * Features:
 * - Responsive design with collapse/expand functionality
 * - Search overlay with modal interface
 * - Customizable theming and colors
 * - Chat history organization by time periods
 * - Quick actions when collapsed
 */

import React, { useState } from 'react';
import { Search, Plus, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface SidebarProps {
  isDark: boolean;
  onAccountClick: () => void;
  customization: CustomizationSettings;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSendMessage: (message: string) => void;
}

export default function Sidebar({ 
  isDark, 
  onAccountClick, 
  customization, 
  isCollapsed, 
  onToggleCollapse,
  onSendMessage 
}: SidebarProps) {
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  /**
   * Handle new chat creation
   * Sends a default greeting message to start a new conversation
   */
  const handleNewChat = () => {
    onSendMessage('Hello! I\'d like to start a new conversation.');
  };

  /**
   * Handle search form submission
   * Sends search query as a message to the chat
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSendMessage(`Search my chat history for: ${searchQuery.trim()}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  // Collapsed sidebar - only show toggle button and quick actions
  if (isCollapsed) {
    return (
      <>
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

          {/* Quick New Chat Button */}
          <button
            onClick={handleNewChat}
            className="p-3 rounded-lg transition-colors text-white hover:opacity-90"
            style={{ 
              background: customization.gradientEnabled 
                ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                : customization.primaryColor
            }}
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchFocused(true)}
            className={`p-3 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-purple-200'
            }`}
            style={{ 
              color: isDark ? undefined : customization.primaryColor
            }}
            title="Search Chats"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Collapsed Account Section */}
          <button 
            onClick={onAccountClick}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-purple-600 hover:bg-purple-100 hover:text-purple-700'
            }`}
            title="Account Settings"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                 style={{ 
                   background: customization.gradientEnabled 
                     ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                     : customization.primaryColor 
                 }}>
              D
            </div>
          </button>
        </div>

        {/* Quick Search Input Overlay - Fixed positioning with high z-index */}
        {isSearchFocused && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsSearchFocused(false);
              }
            }}
          >
            <div 
              className={`w-96 max-w-[90vw] p-6 rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Search Chat History
              </h3>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your conversations..."
                  className={`w-full p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:border-transparent`}
                  style={{ 
                    '--tw-ring-color': customization.primaryColor 
                  } as React.CSSProperties}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchFocused(false);
                    }
                  }}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-lg text-white transition-colors hover:opacity-90"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor
                    }}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full sidebar layout
  return (
    <div 
      className={`w-full h-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex flex-col`}
      style={{
        background: customization.gradientEnabled && !isDark 
          ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
          : undefined
      }}
    >
      {/* Header Section */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-purple-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* App Icon */}
            <div className={`p-1 rounded ${isDark ? 'bg-gray-700' : 'bg-purple-200'}`}>
              <Menu className={`w-4 h-4 ${isDark ? 'text-white' : 'text-purple-700'}`} />
            </div>
            {/* App Name */}
            <span 
              className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-purple-700'}`}
              style={{ 
                fontFamily: customization.fontFamily,
                color: isDark ? undefined : customization.primaryColor
              }}
            >
              BelloSai
            </span>
          </div>
          
          {/* Collapse Button */}
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
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button 
          onClick={handleNewChat}
          className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-white hover:opacity-90"
          style={{ 
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
              : customization.primaryColor,
            fontFamily: customization.fontFamily 
          }}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search Section */}
      <div className="px-4 pb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4`}
                    style={{ color: getTextColor(customization.primaryColor + 'AA', isDark) }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your threads..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white text-gray-900'
              } focus:outline-none focus:ring-2 focus:border-transparent`}
              style={{ 
                fontFamily: customization.fontFamily,
                borderColor: isDark ? undefined : customization.primaryColor + '40',
                '--tw-ring-color': customization.primaryColor,
                '::placeholder': {
                  color: getTextColor(customization.primaryColor + 'AA', isDark)
                }
              } as React.CSSProperties}
            />
          </div>
        </form>
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

      {/* Account Section */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-purple-100'}`}>
        <button 
          onClick={onAccountClick}
          className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
            isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-purple-600 hover:bg-purple-100 hover:text-purple-700'
          }`}
          style={{ fontFamily: customization.fontFamily }}
        >
          {/* User Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold`}
               style={{ 
                 background: customization.gradientEnabled 
                   ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                   : customization.primaryColor 
               }}>
            D
          </div>
          {/* User Info */}
          <div className="flex-1 text-left">
            <div className="text-sm font-medium"
                 style={{ color: isDark 
                   ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                   : customization.primaryColor }}>
              Dmitry Ivanov
            </div>
            <div className={`text-xs`}
                 style={{ color: getSecondaryTextColor(customization.primaryColor + 'AA', isDark) }}>
              Free Plan
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}