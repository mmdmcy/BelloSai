/**
 * Sidebar Component - Navigation and Chat History
 * 
 * This component provides the main navigation sidebar for the BelloSai application,
 * featuring conversation history, quick actions, and responsive design with
 * collapsible functionality for optimal space utilization.
 * 
 * Features:
 * - Conversation history with chronological organization
 * - Collapsible/expandable responsive design
 * - Active conversation highlighting and selection
 * - Individual conversation deletion with confirmation
 * - Theme-aware styling with custom color support
 * - Glass effect support for modern UI aesthetics
 * - Detached mode for flexible layout arrangements
 * 
 * Layout Modes:
 * - Collapsed: Shows only toggle button to save space
 * - Expanded: Full sidebar with conversation list and actions
 * - Detached: Simplified mode when used as standalone component
 * 
 * Conversation Management:
 * - Displays conversation titles with automatic truncation
 * - Shows last updated date for each conversation
 * - Provides delete functionality with visual feedback
 * - Highlights currently active conversation
 * 
 * Theme Integration:
 * - Adapts colors based on dark/light mode
 * - Supports custom primary and secondary colors
 * - Implements gradient backgrounds when enabled
 * - Glass effect compatibility for modern aesthetics
 * 
 * Responsive Design:
 * - Mobile-optimized touch targets
 * - Smooth transitions and hover effects
 * - Proper text contrast in all theme modes
 * - Overflow handling for long conversation lists
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { CustomizationSettings } from '../types/app';

interface SidebarProps {
  isDark: boolean;
  onAccountClick: () => void;
  customization: CustomizationSettings;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSendMessage: (message: string) => void;
  onNewGame: () => void;
  onNewChat?: () => void;
  detachedMode?: boolean; // New prop to indicate if components are detached
  conversations?: any[];
  currentConversationId?: string | null;
  onConversationSelect?: (conversationId: string) => void;
  onConversationDelete?: (conversationId: string) => void;
  hasGlassEffect?: boolean; // New prop for glass effects
  isLoggedIn?: boolean; // New prop to check if user is logged in

}

export default function Sidebar({ 
  isDark, 
  onAccountClick, 
  customization, 
  isCollapsed, 
  onToggleCollapse,
  onSendMessage,
  onNewGame,
  onNewChat,
  detachedMode = false,
  conversations = [],
  currentConversationId,
  onConversationSelect,
  onConversationDelete,
  hasGlassEffect = false,
  isLoggedIn = false
}: SidebarProps) {
  // State for tracking if user has alt-tabbed and needs to refresh
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const [wasTabHidden, setWasTabHidden] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Effect to track tab visibility changes (alt-tab detection)
  useEffect(() => {
    // Mark that user has interacted after a short delay (prevents showing on initial load)
    const interactionTimer = setTimeout(() => {
      setHasInteracted(true);
    }, 2000); // Wait 2 seconds after component mount

    const handleVisibilityChange = () => {
      if (!hasInteracted) return; // Don't trigger during initial page load
      
      if (document.hidden) {
        // User has switched away from the tab
        setWasTabHidden(true);
        console.log('👁️ User switched away from tab');
      } else if (wasTabHidden) {
        // User has returned to the tab after being away
        console.log('👁️ User returned to tab, showing refresh prompt');
        setShowRefreshPrompt(true);
      }
    };

    // Also listen for window focus/blur as backup
    const handleWindowBlur = () => {
      if (!hasInteracted) return;
      setWasTabHidden(true);
      console.log('👁️ Window lost focus');
    };

    const handleWindowFocus = () => {
      if (!hasInteracted) return;
      if (wasTabHidden) {
        console.log('👁️ Window gained focus after being hidden, showing refresh prompt');
        setShowRefreshPrompt(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearTimeout(interactionTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [wasTabHidden, hasInteracted]);


  


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
        className={`w-full h-full ${
          hasGlassEffect && !isDark 
            ? 'glass-sidebar' 
            : ''
        } flex flex-col items-center py-4 gap-4 neo-surface ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        style={{
          background: !hasGlassEffect && customization.gradientEnabled && !isDark 
            ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
            : undefined
        }}
      >
        {/* Expand Button */}
        <button
          onClick={onToggleCollapse}
          className={`p-2 rounded-lg ios-pressable ${
            isDark 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
      className={`w-full h-full ${hasGlassEffect && !isDark ? 'glass-sidebar' : ''} flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'} neo-surface`}
      style={{
        background: !hasGlassEffect && customization.gradientEnabled && !isDark 
          ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
          : undefined
      }}
    >
      {/* Header Section - Only show collapse button in detached mode */}
      <div className={`p-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-end ${hasGlassEffect ? 'ios-toolbar' : ''}`}>
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-md ${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Chat History Section */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        {/* Refresh Prompt - shown when user returns after alt-tabbing (only for logged in users) */}
        {false && showRefreshPrompt && isLoggedIn && (
          <div 
            className={`mb-4 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${
              isDark 
                ? 'bg-blue-900/30 border-blue-700 text-blue-200' 
                : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            onClick={() => {
              setShowRefreshPrompt(false);
              setWasTabHidden(false);
            }}
            title="Click to dismiss"
          >
            <div className="flex items-start gap-2">
              <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className={`text-sm font-medium`} style={{ fontFamily: customization.fontFamily }}>
                  Please refresh the website to get up to date chat history conversations
                </p>
                <p className={`text-xs mt-1 opacity-70`} style={{ fontFamily: customization.fontFamily }}>
                  Click to dismiss
                </p>
              </div>
            </div>
          </div>
        )}

        {conversations.length > 0 ? (
          <>
            {/* Today Section */}
            <div className={`text-xs font-medium mb-2`}
                 style={{ 
                   fontFamily: customization.fontFamily,
                   color: getSecondaryTextColor(customization.primaryColor + 'CC', isDark)
                 }}>
              Recent Conversations
            </div>
            
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={`group relative rounded-xl mb-2 transition-colors ios-pressable ${
                  currentConversationId === conversation.id
                    ? (isDark ? 'bg-gray-800' : 'bg-gray-100')
                    : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                style={{ 
                  background: currentConversationId === conversation.id
                    ? (isDark 
                        ? undefined 
                        : customization.gradientEnabled
                          ? `linear-gradient(135deg, ${customization.secondaryColor}40, ${customization.primaryColor}20)`
                          : customization.secondaryColor + '40')
                    : 'transparent',
                }}
              >
                <button 
                  onClick={() => onConversationSelect?.(conversation.id)}
                   className={`w-full text-left px-3 py-2 pr-10 transition-colors ${
                    currentConversationId === conversation.id
                      ? (isDark ? 'text-white' : 'text-gray-900')
                      : (isDark ? 'text-gray-300 hover:text-white' : 'hover:text-gray-900')
                  }`}
                  style={{ 
                    fontFamily: customization.fontFamily,
                    color: currentConversationId === conversation.id
                      ? (isDark 
                          ? (customization.secondaryColor !== '#a855f7' ? customization.secondaryColor : undefined)
                          : customization.primaryColor)
                      : getTextColor(customization.primaryColor + 'CC', isDark)
                  }}
                >
                  <div className="truncate text-sm">
                    {conversation.title || 'Untitled Conversation'}
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </div>
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${conversation.title || 'Untitled Conversation'}"?`)) {
                      onConversationDelete?.(conversation.id);
                    }
                  }}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark 
                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' 
                      : 'text-gray-500 hover:text-red-600 hover:bg-white'
                  }`}
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm" style={{ fontFamily: customization.fontFamily }}>
              No conversations yet
            </p>
            <p className="text-xs mt-1" style={{ fontFamily: customization.fontFamily }}>
              Start chatting to see your history here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
