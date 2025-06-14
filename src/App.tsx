/**
 * Main Application Component
 * 
 * This is the root component of the BelloSai AI Chat Assistant application.
 * It manages the overall application state, layout configuration, and routing
 * between different views (chat, game, designer mode).
 * 
 * Key Features:
 * - Dynamic grid-based layout system with drag-and-drop designer mode
 * - Responsive mobile-first design with adaptive layouts
 * - Theme switching (light/dark mode)
 * - Customizable UI (colors, fonts, gradients)
 * - Chat functionality with AI responses
 * - Gaming section integration
 * - Account management and settings
 * - Mobile-optimized touch interactions
 * - Clean icon buttons without background colors
 * - Integrated message tracking and Stripe subscription management
 * 
 * State Management:
 * - Layout configuration for responsive grid system
 * - Theme and customization settings
 * - Chat messages and conversation history
 * - UI state (modals, sidebars, etc.)
 * - Authentication and subscription state
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MainContent from './components/MainContent';
import ThemeToggle from './components/ThemeToggle';
import DesignerMode from './components/DesignerMode';
import MobileDesignerMode from './components/MobileDesignerMode';
import AccountMenu from './components/AccountMenu';
import GameSection from './components/GameSection';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { authService, AuthUser } from './lib/auth';
import { authManager, layoutManager, ExtendedLayoutConfig, AuthState, defaultLayoutWithAuth, MobileLayoutConfig, defaultMobileLayout } from './lib/auth-integration'
import { sendChatMessage, DeepSeekModel, ChatMessage } from './lib/supabase-chat';
import { MessageService } from './lib/messageService';
import { LogIn, UserPlus, User, Loader2, Menu, X } from 'lucide-react'

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
 * Using ExtendedLayoutConfig from auth-integration for consistency
 */
export type LayoutConfig = ExtendedLayoutConfig;

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

// Main App Component wrapped with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  // Use the auth context
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Theme state - controls light/dark mode
  const [isDark, setIsDark] = useState(false);
  
  // Designer mode state - enables/disables layout editing
  const [isDesignerMode, setIsDesignerMode] = useState(false);
  
  // Account menu visibility state
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Current view state - switches between chat and game modes
  const [currentView, setCurrentView] = useState<'chat' | 'game'>('chat');
  
  // Chat messages array
  const [messages, setMessages] = useState<Message[]>([]);
  
  // AI model selection
  const [selectedModel, setSelectedModel] = useState('DeepSeek-V3');
  
  // Message counter for AI response logic
  const [messageCount, setMessageCount] = useState(0);
  
  // Last user message for regeneration
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  
  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Search state for detached search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  // User customization settings with default values
  const [customization, setCustomization] = useState<CustomizationSettings>({
    showQuestions: true,
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    fontFamily: 'Inter',
    gradientEnabled: false,
    gradientColors: ['#7c3aed', '#a855f7']
  });

  // Authentication state management (legacy - keeping for compatibility)
  const [authState, setAuthState] = useState<AuthState>(authManager.getState());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', fullName: '' });
  const [authModalLoading, setAuthModalLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Layout configuration - uses the auth-integrated layout manager
  const [layout, setLayout] = useState<ExtendedLayoutConfig>(() => {
    const loadedLayout = layoutManager.getLayout();
    return loadedLayout;
  });

  // Mobile layout configuration - separate from desktop
  const [mobileLayout, setMobileLayout] = useState<MobileLayoutConfig>(() => {
    // Force reset to fix overlapping elements - temporary fix
    layoutManager.saveMobileLayout(defaultMobileLayout);
    return defaultMobileLayout;
  });

  // Available models for AI
  const availableModels = ['DeepSeek-V3', 'DeepSeek-R1'];

  // Mobile responsive detection
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 768); // Tablet and mobile breakpoint
    };

    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Initialize authentication and layout sync
  useEffect(() => {
    const unsubscribe = authManager.subscribe((newAuthState) => {
      setAuthState(newAuthState);
      
      // Sync layout when user logs in
      if (newAuthState.user && !authState.user) {
        // User just logged in, sync their layout from cloud
        const syncLayout = async () => {
          try {
            const cloudLayout = await authService.getUserProfile();
            if (cloudLayout?.api_keys?.layout_config) {
              const parsedLayout = JSON.parse(cloudLayout.api_keys.layout_config as string);
              setLayout(parsedLayout);
              layoutManager.saveLayout(parsedLayout);
            }
          } catch (error) {
            console.log('No cloud layout found, using current layout');
          }
        };
        syncLayout();
      }
    });

    return unsubscribe;
  }, [authState.user]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalLoading(true);
    setAuthError(null);

    try {
      await authManager.signIn(loginForm.email, loginForm.password);
      setShowLoginModal(false);
      setLoginForm({ email: '', password: '' });
    } catch (error: any) {
      setAuthError(error.message || 'Login failed');
    } finally {
      setAuthModalLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalLoading(true);
    setAuthError(null);

    try {
      await authManager.signUp(signupForm.email, signupForm.password, {
        full_name: signupForm.fullName
      });
      
      // Check if email confirmation is required
      const { data } = await authService.supabase.auth.getSession();
      if (!data.session) {
        setAuthError('Please check your email for a confirmation link to complete your registration.');
      } else {
        setShowSignupModal(false);
        setSignupForm({ email: '', password: '', fullName: '' });
      }
    } catch (error: any) {
      setAuthError(error.message || 'Signup failed');
    } finally {
      setAuthModalLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setIsAccountMenuOpen(false);
      // Clear any user-specific state
      setMessages([]);
      setMessageCount(0);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Theme toggle
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Designer mode toggle
  const toggleDesignerMode = () => {
    setIsDesignerMode(!isDesignerMode);
  };

  // Account menu toggle
  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };

  // Sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Send message function with message tracking
  const sendMessage = async (content: string) => {
    if (!content.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLastUserMessage(content.trim());
    setIsGenerating(true);

    // Track the message if user is authenticated
    if (user) {
      try {
        await MessageService.trackMessage(content.trim());
      } catch (error) {
        console.error('Failed to track message:', error);
      }
    }

    try {
      // Convert our Message format to ChatMessage format for the API
      const chatHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add the new user message to history
      chatHistory.push({
        role: 'user',
        content: content.trim()
      });

      // Determine model to use
      let modelToUse: DeepSeekModel = 'deepseek-chat';
      if (selectedModel === 'DeepSeek-R1') {
        modelToUse = 'deepseek-reasoner';
      }

      // Send to AI
      const response = await sendChatMessage(chatHistory, modelToUse);
      
      if (response.success && response.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.data.content,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setMessageCount(prev => prev + 1);
      } else {
        // Handle error
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Sorry, I encountered an error: ${response.error || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate last AI response
  const regenerateResponse = async () => {
    if (!lastUserMessage || isGenerating || messages.length === 0) return;

    // Remove the last AI message if it exists
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'ai') {
        newMessages.pop();
      }
      return newMessages;
    });

    setIsGenerating(true);

    try {
      // Get chat history without the last AI response
      const chatHistory: ChatMessage[] = messages
        .filter((_, index) => index < messages.length - 1 || messages[messages.length - 1].type === 'user')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Determine model to use
      let modelToUse: DeepSeekModel = 'deepseek-chat';
      if (selectedModel === 'DeepSeek-R1') {
        modelToUse = 'deepseek-reasoner';
      }

      // Send to AI
      const response = await sendChatMessage(chatHistory, modelToUse);
      
      if (response.success && response.data) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: response.data.content,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Handle error
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `Sorry, I encountered an error: ${response.error || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while regenerating the response. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // New chat function
  const handleNewChat = () => {
    setMessages([]);
    setMessageCount(0);
    setLastUserMessage('');
  };

  // Search function
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // For now, just send the search query as a message
      sendMessage(`Search: ${searchQuery.trim()}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  // Layout update function
  const updateLayout = (newLayout: ExtendedLayoutConfig) => {
    setLayout(newLayout);
    layoutManager.saveLayout(newLayout);
    
    // Sync to cloud if user is authenticated
    if (authState.user) {
      const syncToCloud = async () => {
        try {
          await authService.updateUserProfile({
            api_keys: {
              layout_config: JSON.stringify(newLayout)
            }
          });
        } catch (error) {
          console.error('Failed to sync layout to cloud:', error);
        }
      };
      syncToCloud();
    }
  };

  // Mobile layout update function
  const updateMobileLayout = (newMobileLayout: MobileLayoutConfig) => {
    setMobileLayout(newMobileLayout);
    layoutManager.saveMobileLayout(newMobileLayout);
    
    // Sync to cloud if user is authenticated
    if (authState.user) {
      const syncToCloud = async () => {
        try {
          await authService.updateUserProfile({
            api_keys: {
              mobile_layout_config: JSON.stringify(newMobileLayout)
            }
          });
        } catch (error) {
          console.error('Failed to sync mobile layout to cloud:', error);
        }
      };
      syncToCloud();
    }
  };

  // Customization update function
  const updateCustomization = (newSettings: Partial<CustomizationSettings>) => {
    setCustomization(prev => ({ ...prev, ...newSettings }));
  };

  // Back to chat function
  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  // New game function
  const handleNewGame = () => {
    // Game logic here
  };

  // Get user display name and initial
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.full_name || user.email.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    if (!user) return 'G';
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Get used grid area for layout calculations
  const getUsedGridArea = () => {
    const elements = Object.values(layout);
    const maxX = Math.max(...elements.map(el => el.x + el.width));
    const maxY = Math.max(...elements.map(el => el.y + el.height));
    return { width: maxX, height: maxY };
  };

  // Get sorted elements for rendering order
  const getSortedElements = () => {
    return Object.entries(layout).sort(([, a], [, b]) => a.zIndex - b.zIndex);
  };

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading BelloSai...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
      style={{ fontFamily: customization.fontFamily }}
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="h-screen flex flex-col">
          {/* Mobile Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className={`p-2 rounded-lg ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-lg font-semibold">BelloSai</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              {user ? (
                <button
                  onClick={toggleAccountMenu}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                       style={{ 
                         background: customization.gradientEnabled 
                           ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                           : customization.primaryColor
                       }}>
                    {getUserInitial()}
                  </div>
                  <span className="text-sm font-medium">{getUserDisplayName()}</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSignupModal(true)}
                    className="px-3 py-2 text-sm rounded-lg text-white transition-colors"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            {isDesignerMode ? (
              <MobileDesignerMode
                layout={mobileLayout}
                onLayoutChange={updateMobileLayout}
                isDark={isDark}
                customization={customization}
              />
            ) : currentView === 'chat' ? (
              messages.length > 0 ? (
                <ChatView
                  messages={messages}
                  onSendMessage={sendMessage}
                  onRegenerateResponse={regenerateResponse}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  availableModels={availableModels}
                  isDark={isDark}
                  isGenerating={isGenerating}
                  customization={customization}
                />
              ) : (
                <MainContent
                  isDark={isDark}
                  onSendMessage={sendMessage}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  availableModels={availableModels}
                  customization={customization}
                />
              )
            ) : (
              <GameSection
                isDark={isDark}
                onBackToChat={handleBackToChat}
                onNewGame={handleNewGame}
                customization={customization}
              />
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="h-screen flex">
          {/* Sidebar */}
          <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
            <Sidebar
              isDark={isDark}
              onAccountClick={toggleAccountMenu}
              customization={customization}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              onSendMessage={sendMessage}
              onNewGame={handleNewGame}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">BelloSai</h1>
                <button
                  onClick={handleNewChat}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  New Chat
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleDesignerMode}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    isDesignerMode 
                      ? 'bg-purple-600 text-white' 
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Designer Mode
                </button>
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                {user ? (
                  <button
                    onClick={toggleAccountMenu}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                         style={{ 
                           background: customization.gradientEnabled 
                             ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                             : customization.primaryColor
                         }}>
                      {getUserInitial()}
                    </div>
                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                    <button
                      onClick={() => setShowSignupModal(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-white transition-colors"
                      style={{ 
                        background: customization.gradientEnabled 
                          ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                          : customization.primaryColor
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {isDesignerMode ? (
                <DesignerMode
                  layout={layout}
                  onLayoutChange={updateLayout}
                  isDark={isDark}
                  customization={customization}
                />
              ) : currentView === 'chat' ? (
                messages.length > 0 ? (
                  <ChatView
                    messages={messages}
                    onSendMessage={sendMessage}
                    onRegenerateResponse={regenerateResponse}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    availableModels={availableModels}
                    isDark={isDark}
                    isGenerating={isGenerating}
                    customization={customization}
                  />
                ) : (
                  <MainContent
                    isDark={isDark}
                    onSendMessage={sendMessage}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    availableModels={availableModels}
                    customization={customization}
                  />
                )
              ) : (
                <GameSection
                  isDark={isDark}
                  onBackToChat={handleBackToChat}
                  onNewGame={handleNewGame}
                  customization={customization}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLoginModal(false);
              setAuthError(null);
            }
          }}
        >
          <div 
            className={`w-96 max-w-[90vw] p-6 rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back
            </h3>
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
                {authError}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
                className={`w-full p-3 rounded-lg border mb-3 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
                style={{ 
                  '--tw-ring-color': customization.primaryColor 
                } as React.CSSProperties}
                required
              />
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                className={`w-full p-3 rounded-lg border mb-4 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
                style={{ 
                  '--tw-ring-color': customization.primaryColor 
                } as React.CSSProperties}
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={authModalLoading || !loginForm.email || !loginForm.password}
                  className="flex-1 py-3 px-4 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ 
                    background: customization.gradientEnabled 
                      ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                      : customization.primaryColor
                  }}
                >
                  {authModalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setAuthError(null);
                  }}
                  className={`px-4 py-3 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-4 text-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Don't have an account?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowSignupModal(true);
                    setAuthError(null);
                  }}
                  className="text-sm font-medium"
                  style={{ color: customization.primaryColor }}
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignupModal(false);
              setAuthError(null);
            }
          }}
        >
          <div 
            className={`w-96 max-w-[90vw] p-6 rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Join BelloSai
            </h3>
            {authError && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                authError.includes('check your email') 
                  ? 'bg-blue-100 border border-blue-300 text-blue-700'
                  : 'bg-red-100 border border-red-300 text-red-700'
              }`}>
                {authError}
              </div>
            )}
            <form onSubmit={handleSignup}>
              <input
                type="text"
                value={signupForm.fullName}
                onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Full name"
                className={`w-full p-3 rounded-lg border mb-3 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
                style={{ 
                  '--tw-ring-color': customization.primaryColor 
                } as React.CSSProperties}
                required
              />
              <input
                type="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
                className={`w-full p-3 rounded-lg border mb-3 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
                style={{ 
                  '--tw-ring-color': customization.primaryColor 
                } as React.CSSProperties}
                required
              />
              <input
                type="password"
                value={signupForm.password}
                onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password (min 6 characters)"
                className={`w-full p-3 rounded-lg border mb-4 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
                style={{ 
                  '--tw-ring-color': customization.primaryColor 
                } as React.CSSProperties}
                minLength={6}
                required
              />
              <div className="flex gap-3">
                {!authError?.includes('check your email') && (
                  <button
                    type="submit"
                    disabled={authModalLoading || !signupForm.email || !signupForm.password}
                    className="flex-1 py-3 px-4 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor
                    }}
                  >
                    {authModalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowSignupModal(false);
                    setAuthError(null);
                  }}
                  className={`${authError?.includes('check your email') ? 'flex-1' : ''} px-4 py-3 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {authError?.includes('check your email') ? 'Close' : 'Cancel'}
                </button>
              </div>
              <div className="mt-4 text-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Already have an account?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowLoginModal(true);
                    setAuthError(null);
                  }}
                  className="text-sm font-medium"
                  style={{ color: customization.primaryColor }}
                >
                  Sign in
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
              user={user}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;