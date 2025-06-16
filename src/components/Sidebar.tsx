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
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { CustomizationSettings } from '../App';

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
  onConversationDelete
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
      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        {/* New Chat Button */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className={`w-full mb-4 px-3 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'
            }`}
            style={{ 
              fontFamily: customization.fontFamily,
              borderColor: isDark ? undefined : customization.primaryColor + '40'
            }}
          >
            + Nieuwe Chat
          </button>
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
                className={`group relative rounded-lg mb-2 transition-colors ${
                  currentConversationId === conversation.id
                    ? (isDark ? 'bg-gray-700' : 'bg-purple-50')
                    : (isDark ? 'hover:bg-gray-700' : 'hover:bg-purple-50')
                }`}
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
                      ? (isDark ? 'text-white' : 'text-purple-800')
                      : (isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-800')
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
                    if (window.confirm(`Weet je zeker dat je "${conversation.title || 'Untitled Conversation'}" wilt verwijderen?`)) {
                      onConversationDelete?.(conversation.id);
                    }
                  }}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark 
                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' 
                      : 'text-gray-500 hover:text-red-600 hover:bg-white'
                  }`}
                  title="Conversatie verwijderen"
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