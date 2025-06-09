/**
 * Main Application Component
 * 
 * This is the root component of the BelloSai AI Chat Assistant application.
 * It manages the overall application state, layout configuration, and routing
 * between different views (chat, game, designer mode).
 * 
 * Key Features:
 * - Dynamic grid-based layout system with drag-and-drop designer mode
 * - Theme switching (light/dark mode)
 * - Customizable UI (colors, fonts, gradients)
 * - Chat functionality with AI responses
 * - Gaming section integration
 * - Account management and settings
 * - Detached components for maximum customization
 * - Clean icon buttons without background colors
 * 
 * State Management:
 * - Layout configuration for responsive grid system
 * - Theme and customization settings
 * - Chat messages and conversation history
 * - UI state (modals, sidebars, etc.)
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MainContent from './components/MainContent';
import ThemeToggle from './components/ThemeToggle';
import DesignerMode from './components/DesignerMode';
import AccountMenu from './components/AccountMenu';
import GameSection from './components/GameSection';

/**
 * Message Interface
 * Defines the structure of chat messages in the application
 */
export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

/**
 * Layout Configuration Interface
 * Defines the grid-based layout system for UI components
 * Each component has position (x, y), size (width, height), and layer (zIndex)
 * Now includes detached sidebar components for maximum customization
 */
export interface LayoutConfig {
  sidebar: { x: number; y: number; width: number; height: number; zIndex: number };
  mainContent: { x: number; y: number; width: number; height: number; zIndex: number };
  themeToggle: { x: number; y: number; width: number; height: number; zIndex: number };
  topBar: { x: number; y: number; width: number; height: number; zIndex: number };
  inputBox: { x: number; y: number; width: number; height: number; zIndex: number };
  designerButton: { x: number; y: number; width: number; height: number; zIndex: number };
  settingsButton: { x: number; y: number; width: number; height: number; zIndex: number };
  // Detached sidebar components
  appLogo: { x: number; y: number; width: number; height: number; zIndex: number };
  newChatButton: { x: number; y: number; width: number; height: number; zIndex: number };
  newGameButton: { x: number; y: number; width: number; height: number; zIndex: number };
  searchButton: { x: number; y: number; width: number; height: number; zIndex: number };
  accountPanel: { x: number; y: number; width: number; height: number; zIndex: number };
}

/**
 * Customization Settings Interface
 * Defines user-customizable appearance settings
 */
export interface CustomizationSettings {
  showQuestions: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  gradientEnabled: boolean;
  gradientColors: string[];
}

function App() {
  // Theme state - controls light/dark mode
  const [isDark, setIsDark] = useState(false);
  
  // Designer mode state - enables/disables layout editing
  const [isDesignerMode, setIsDesignerMode] = useState(false);
  
  // Account menu visibility state
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Current view state - switches between chat and game modes
  const [currentView, setCurrentView] = useState<'chat' | 'game'>('chat');
  
  // Chat messages array
  const [messages, setMessages] = useState<Message[]>([]);
  
  // AI model selection
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  
  // Message counter for AI response logic
  const [messageCount, setMessageCount] = useState(0);

  // Search state for detached search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // User customization settings with default values
  const [customization, setCustomization] = useState<CustomizationSettings>({
    showQuestions: true,
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    fontFamily: 'Inter',
    gradientEnabled: false,
    gradientColors: ['#7c3aed', '#a855f7']
  });

  // Layout configuration - defines grid positions for all UI components
  // Main content moved up 1 row (y: 1), input box moved up 1 row (y: 13), search button moved above sidebar
  const [layout, setLayout] = useState<LayoutConfig>({
    sidebar: { x: 0, y: 5, width: 3, height: 9, zIndex: 1 }, // Moved down to make room for search button
    mainContent: { x: 5, y: 1, width: 10, height: 12, zIndex: 1 }, // Moved up 1 row
    themeToggle: { x: 17, y: 0, width: 1, height: 1, zIndex: 4 },
    topBar: { x: 0, y: 0, width: 20, height: 1, zIndex: 2 },
    inputBox: { x: 4, y: 13, width: 12, height: 2, zIndex: 1 }, // Moved up 1 row
    designerButton: { x: 19, y: 0, width: 1, height: 1, zIndex: 999 },
    settingsButton: { x: 18, y: 0, width: 1, height: 1, zIndex: 4 },
    // Detached sidebar components - search button moved above sidebar
    appLogo: { x: 0, y: 1, width: 3, height: 1, zIndex: 3 },
    newGameButton: { x: 0, y: 2, width: 3, height: 1, zIndex: 3 },
    newChatButton: { x: 0, y: 3, width: 3, height: 1, zIndex: 3 },
    searchButton: { x: 0, y: 4, width: 3, height: 1, zIndex: 3 }, // Moved above sidebar
    accountPanel: { x: 0, y: 15, width: 3, height: 1, zIndex: 3 }
  });

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  /**
   * Toggle designer mode for layout editing
   */
  const toggleDesignerMode = () => {
    setIsDesignerMode(!isDesignerMode);
  };

  /**
   * Toggle account menu visibility
   */
  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };

  /**
   * Toggle sidebar collapsed state
   */
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  /**
   * Handle sending a new message
   * Creates user message and simulates AI response
   */
  const sendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageCount(prev => prev + 1);

    // Simulate AI response after a short delay
    setTimeout(() => {
      let aiResponse: Message;
      
      if (messageCount === 0) {
        // First response
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Hello! How can I help you today?',
          timestamp: new Date()
        };
      } else {
        // Second and subsequent responses with code
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Here\'s a simple Python "Hello, World!" script:\n\n```python\nprint("Hello, world!")\n```',
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, aiResponse]);
    }, 500);
  };

  /**
   * Handle new chat creation
   */
  const handleNewChat = () => {
    sendMessage('Hello! I\'d like to start a new conversation.');
  };

  /**
   * Handle search functionality
   */
  const handleSearch = () => {
    if (searchQuery.trim()) {
      sendMessage(`Search my chat history for: ${searchQuery.trim()}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  // Available AI models for selection
  const availableModels = [
    'Gemini 2.5 Flash',
    'GPT-4 Turbo',
    'Claude 3.5 Sonnet',
    'Llama 3.1 70B',
    'Mistral Large'
  ];

  /**
   * Update layout configuration
   * Ensures designer button always stays at top layer
   */
  const updateLayout = (newLayout: LayoutConfig) => {
    const updatedLayout = {
      ...newLayout,
      designerButton: {
        ...newLayout.designerButton,
        zIndex: 999
      }
    };
    setLayout(updatedLayout);
  };

  /**
   * Update customization settings
   */
  const updateCustomization = (newSettings: Partial<CustomizationSettings>) => {
    setCustomization(prev => ({ ...prev, ...newSettings }));
  };

  /**
   * Navigate back to chat view from game section
   */
  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  /**
   * Navigate to game section
   */
  const handleNewGame = () => {
    setCurrentView('game');
  };

  // Render designer mode if active
  if (isDesignerMode) {
    return (
      <DesignerMode
        isDark={isDark}
        layout={layout}
        onLayoutChange={updateLayout}
        onExitDesigner={() => setIsDesignerMode(false)}
        onToggleTheme={toggleTheme}
        customization={customization}
        onCustomizationChange={updateCustomization}
      />
    );
  }

  // Render game section if selected
  if (currentView === 'game') {
    return (
      <GameSection
        isDark={isDark}
        customization={customization}
        onBackToChat={handleBackToChat}
        onToggleTheme={toggleTheme}
      />
    );
  }

  /**
   * Calculate the actual used grid area to eliminate empty space
   * This optimizes the grid layout by only using necessary columns/rows
   */
  const getUsedGridArea = () => {
    const elements = Object.values(layout);
    const maxX = Math.max(...elements.map(el => el.x + el.width));
    const maxY = Math.max(...elements.map(el => el.y + el.height));
    return { maxX, maxY };
  };

  const { maxX, maxY } = getUsedGridArea();

  /**
   * Get sorted elements by z-index for proper rendering order
   * Elements with higher z-index should be rendered last (on top)
   */
  const getSortedElements = () => {
    return Object.entries(layout).sort(([, a], [, b]) => a.zIndex - b.zIndex);
  };

  return (
    <div 
      className={`h-screen overflow-hidden ${isDark ? 'dark bg-gray-900' : 'bg-purple-50'}`}
      style={{ fontFamily: customization.fontFamily }}
    >
      {/* Dynamic Grid Container - only uses necessary space */}
      <div 
        className="h-full w-full grid relative"
        style={{
          gridTemplateColumns: `repeat(${maxX}, 1fr)`,
          gridTemplateRows: `repeat(${maxY}, 1fr)`
        }}
      >
        {/* Render elements in z-index order (lowest to highest) */}
        {getSortedElements().map(([key, config]) => {
          const elementKey = key as keyof LayoutConfig;
          
          return (
            <div
              key={elementKey}
              className="relative"
              style={{
                gridColumn: `${config.x + 1} / ${Math.min(config.x + config.width + 1, maxX + 1)}`,
                gridRow: `${config.y + 1} / ${Math.min(config.y + config.height + 1, maxY + 1)}`,
                zIndex: config.zIndex
              }}
            >
              {/* Top Header Bar */}
              {elementKey === 'topBar' && (
                <div 
                  className="h-full w-full text-white"
                  style={{
                    background: customization.gradientEnabled 
                      ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                      : customization.primaryColor
                  }}
                />
              )}
              
              {/* Sidebar Component - Now reduced and without detached components */}
              {elementKey === 'sidebar' && (
                <Sidebar 
                  isDark={isDark} 
                  onAccountClick={toggleAccountMenu}
                  customization={customization}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={toggleSidebar}
                  onSendMessage={sendMessage}
                  onNewGame={handleNewGame}
                  detachedMode={true} // New prop to indicate detached components
                />
              )}

              {/* App Logo - Detached from sidebar */}
              {elementKey === 'appLogo' && (
                <div 
                  className={`h-full w-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex items-center justify-center`}
                  style={{
                    background: customization.gradientEnabled && !isDark 
                      ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                      : undefined
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${isDark ? 'bg-gray-700' : 'bg-purple-200'}`}>
                      <svg className={`w-4 h-4 ${isDark ? 'text-white' : 'text-purple-700'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z"/>
                      </svg>
                    </div>
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
                </div>
              )}

              {/* New Game Button - Detached with proper styling */}
              {elementKey === 'newGameButton' && (
                <div 
                  className={`h-full w-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex items-center justify-center p-2`}
                  style={{
                    background: customization.gradientEnabled && !isDark 
                      ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                      : undefined
                  }}
                >
                  <button 
                    onClick={handleNewGame}
                    className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-white hover:opacity-90"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor,
                      fontFamily: customization.fontFamily
                    }}
                    title="New Game"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.5,4A5.5,5.5 0 0,0 2,9.5C2,10.82 2.5,12 3.3,12.9L12,21.5L20.7,12.9C21.5,12 22,10.82 22,9.5A5.5,5.5 0 0,0 16.5,4C14.64,4 13,4.93 12,6.34C11,4.93 9.36,4 7.5,4V4Z"/>
                    </svg>
                    New Game
                  </button>
                </div>
              )}

              {/* New Chat Button - Detached with proper styling */}
              {elementKey === 'newChatButton' && (
                <div 
                  className={`h-full w-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex items-center justify-center p-2`}
                  style={{
                    background: customization.gradientEnabled && !isDark 
                      ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                      : undefined
                  }}
                >
                  <button 
                    onClick={handleNewChat}
                    className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-white hover:opacity-90"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor,
                      fontFamily: customization.fontFamily
                    }}
                    title="New Chat"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    New Chat
                  </button>
                </div>
              )}

              {/* Search Button - Detached and moved above sidebar */}
              {elementKey === 'searchButton' && (
                <div 
                  className={`h-full w-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex items-center justify-center px-2`}
                  style={{
                    background: customization.gradientEnabled && !isDark 
                      ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                      : undefined
                  }}
                >
                  <button
                    onClick={() => setIsSearchFocused(true)}
                    className={`w-full h-full flex items-center justify-center gap-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    } border`}
                    style={{ fontFamily: customization.fontFamily }}
                    title="Search Chats"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                    </svg>
                    <span className="text-xs">Search</span>
                  </button>
                </div>
              )}

              {/* Account Panel - Detached */}
              {elementKey === 'accountPanel' && (
                <div 
                  className={`h-full w-full ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-purple-50 border-purple-100'} border-r flex items-center justify-center`}
                  style={{
                    background: customization.gradientEnabled && !isDark 
                      ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                      : undefined
                  }}
                >
                  <button 
                    onClick={toggleAccountMenu}
                    className={`w-full h-full flex items-center justify-center gap-2 transition-colors ${
                      isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-purple-600 hover:bg-purple-100 hover:text-purple-700'
                    }`}
                    style={{ fontFamily: customization.fontFamily }}
                    title="Account Settings"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs`}
                         style={{ 
                           background: customization.gradientEnabled 
                             ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                             : customization.primaryColor 
                         }}>
                      D
                    </div>
                    <div className="text-xs">Dmitry</div>
                  </button>
                </div>
              )}

              {/* Main Content Area */}
              {elementKey === 'mainContent' && (
                <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}>
                  {messages.length === 0 ? (
                    <MainContent 
                      isDark={isDark} 
                      onSendMessage={sendMessage}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      availableModels={availableModels}
                      hideInput={true}
                      customization={customization}
                    />
                  ) : (
                    <ChatView 
                      isDark={isDark} 
                      messages={messages}
                      onSendMessage={sendMessage}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      availableModels={availableModels}
                      hideInput={true}
                      customization={customization}
                    />
                  )}
                </div>
              )}

              {/* Input Box */}
              {elementKey === 'inputBox' && (
                <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-purple-50'} p-4`}>
                  {messages.length === 0 ? (
                    <MainContent 
                      isDark={isDark} 
                      onSendMessage={sendMessage}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      availableModels={availableModels}
                      inputOnly={true}
                      customization={customization}
                    />
                  ) : (
                    <ChatView 
                      isDark={isDark} 
                      messages={messages}
                      onSendMessage={sendMessage}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      availableModels={availableModels}
                      inputOnly={true}
                      customization={customization}
                    />
                  )}
                </div>
              )}

              {/* Theme Toggle Button - Clean without background */}
              {elementKey === 'themeToggle' && (
                <div className="h-full w-full flex items-center justify-center">
                  <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                </div>
              )}

              {/* Settings Button - Clean without background */}
              {elementKey === 'settingsButton' && (
                <div className="h-full w-full flex items-center justify-center">
                  <button
                    onClick={toggleAccountMenu}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    title="Settings"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Designer Mode Toggle - Clean without background */}
              {elementKey === 'designerButton' && (
                <div className="h-full w-full flex items-center justify-center">
                  <button
                    onClick={toggleDesignerMode}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    title="Designer Mode"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Search Modal - Fixed positioning with high z-index */}
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
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
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

      {/* Account Menu Overlay - Modal that appears over everything with highest z-index */}
      {isAccountMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            // Close menu when clicking outside
            if (e.target === e.currentTarget) {
              setIsAccountMenuOpen(false);
            }
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AccountMenu
              isDark={isDark}
              onClose={() => setIsAccountMenuOpen(false)}
              customization={customization}
              onCustomizationChange={updateCustomization}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;