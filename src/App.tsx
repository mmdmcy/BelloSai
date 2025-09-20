/**
 * Main Application Component - BelloSai AI Chat Assistant
 * 
 * This is the root React component that serves as the entry point for the entire application.
 * It orchestrates the core functionality including chat interface, AI model integration,
 * subscription management, and user authentication.
 * 
 * Architecture Overview:
 * - Manages global application state using React hooks and context
 * - Implements responsive grid-based layout system with drag-and-drop customization
 * - Handles real-time chat messaging with multiple AI providers (DeepSeek, Claude, Mistral)
 * - Integrates Stripe payment processing for subscription management
 * - Provides anonymous usage tracking with daily message limits
 * 
 * Key Features:
 * - Real-time streaming AI chat with multiple models
 * - Subscription-based usage limits (Free: 20 msgs, Pro: unlimited)
 * - Anonymous user support with 10 messages/day limit
 * - Drag-and-drop layout designer for UI customization
 * - Multi-theme support with custom color schemes
 * - Mobile-responsive design with touch-optimized interactions
 * - AI Feud game integration
 * - Conversation history and search functionality
 * 
 * State Management:
 * - Authentication state via AuthContext and Supabase Auth
 * - Chat messages stored in Supabase with real-time sync
 * - UI preferences persisted in localStorage
 * - Subscription status tracked via Stripe webhooks
 * 
 * External Dependencies:
 * - Supabase: Database, auth, real-time subscriptions, edge functions
 * - Stripe: Payment processing and subscription management
 * - Various AI APIs: DeepSeek, Claude, Mistral for chat responses
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MessageProvider, useMessages } from './contexts/MessageContext';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MainContent from './components/MainContent';
import ThemeToggle from './components/ThemeToggle';
import DesignerMode from './components/DesignerMode';
import MobileDesignerMode from './components/MobileDesignerMode';
import AccountMenu from './components/AccountMenu';
import GameSection from './components/GameSection';
import APIKeyManager from './components/APIKeyManager';
import ModelSelector from './components/ModelSelector';
import { supabase } from './lib/supabase';
import { chatFeaturesService } from './lib/chat-features';
import { anonymousUsageService } from './lib/anonymous-usage';
import { layoutManager, ExtendedLayoutConfig, MobileLayoutConfig, defaultMobileLayout, defaultLayoutWithAuth } from './lib/auth-integration'
import { StripeService } from './lib/stripeService';
import { LogIn, UserPlus, User, Loader2 } from 'lucide-react';

/**
 * Message Interface
 * Defines the structure of chat messages in the application
 */
export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  isResolving?: boolean;
  conversationId?: string;
  error?: string;
  isOptimistic?: boolean;
}

/**
 * Layout Configuration Interface
 * Using ExtendedLayoutConfig from auth-integration for consistency
 */
export type LayoutConfig = ExtendedLayoutConfig;

export interface LayoutElement {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible?: boolean;
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
  selectedTheme: string;
}

export interface Customization {
  showQuestions: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  gradientEnabled: boolean;
  gradientColors: string[];
  selectedTheme: string;
}

// Theme interface moved to src/types/app.ts

export interface ModelCapability {
  key: string;
  label: string;
  icon: string; // Lucide icon naam
}

export interface ModelInfo {
  name: string;
  code: string;
  provider: 'DeepSeek' | 'Claude' | 'Mistral';
  capabilities: string[]; // array van capability keys
  description?: string;
  premium?: boolean; // true if model is for premium users only
}

export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  text: { key: 'text', label: 'Text', icon: 'FileText' },
  image: { key: 'image', label: 'Image', icon: 'Image' },
  audio: { key: 'audio', label: 'Audio', icon: 'Mic' },
  video: { key: 'video', label: 'Video', icon: 'Video' },
  code: { key: 'code', label: 'Code', icon: 'Code' },
  function_calling: { key: 'function_calling', label: 'Function Calling', icon: 'FunctionSquare' },
  caching: { key: 'caching', label: 'Caching', icon: 'Database' },
  structured_outputs: { key: 'structured_outputs', label: 'Structured Output', icon: 'ListChecks' },
  search: { key: 'search', label: 'Search', icon: 'Globe' },
  tuning: { key: 'tuning', label: 'Tuning', icon: 'SlidersHorizontal' },
  reasoning: { key: 'reasoning', label: 'Reasoning', icon: 'Brain' },
};

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    name: 'Claude Haiku 3',
    code: 'claude-3-haiku-20240307',
    provider: 'Claude',
    capabilities: ['text', 'reasoning'],
    description: 'Fast, cost-effective Claude 3 Haiku model.',
    premium: false
  },
  {
    name: 'DeepSeek V3',
    code: 'DeepSeek-V3',
    provider: 'DeepSeek',
    capabilities: ['text', 'code', 'reasoning'],
    description: 'DeepSeek chat model, strong general AI.',
    premium: false
  },
  {
    name: 'DeepSeek R1',
    code: 'DeepSeek-R1',
    provider: 'DeepSeek',
    capabilities: ['text', 'code', 'reasoning'],
    description: 'DeepSeek reasoner, optimized for reasoning.',
    premium: true
  },
  {
    name: 'Mistral Medium 3',
    code: 'mistral-medium-latest',
    provider: 'Mistral',
    capabilities: ['text', 'reasoning'],
    description: 'State-of-the-art performance. Cost-efficient.',
    premium: false
  },
  {
    name: 'Mistral Small 3.1',
    code: 'mistral-small-latest',
    provider: 'Mistral',
    capabilities: ['text', 'reasoning', 'multimodal'],
    description: 'SOTA. Multimodal. Multilingual. Apache 2.0.',
    premium: false
  },
  {
    name: 'Codestral',
    code: 'codestral-latest',
    provider: 'Mistral',
    capabilities: ['text', 'code'],
    description: 'Lightweight, fast, proficient in 80+ programming languages.',
    premium: false
  }
];

// Theme definitions moved to src/theme/registry.ts

// Grid layout constants
const maxX = 20;
const maxY = 17;

const App: React.FC = () => {
  const { theme, setTheme, availableThemes, getTheme, applyTheme, isDark, toggleTheme, hasGlassEffect, getCurrentColors } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    messages,
    setMessages,
    sendMessage,
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    isCreatingConversation,
    handleNewConversation,
    searchResults,
    setSearchResults,
    searchConversations
  } = useMessages();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const [layout, setLayout] = useState<LayoutConfig>(defaultLayoutWithAuth);
  const [mobileLayout, setMobileLayout] = useState<MobileLayoutConfig>(defaultMobileLayout);
  const [customization, setCustomization] = useState<Customization>({
    showQuestions: true,
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    fontFamily: 'Inter',
    gradientEnabled: false,
    gradientColors: ['#7c3aed', '#a855f7'],
    selectedTheme: 'default'
  });
  const [currentModel, setCurrentModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [showChatSharing, setShowChatSharing] = useState(false);
  const [showAnonymousUsage, setShowAnonymousUsage] = useState(false);

  // Additional missing state variables
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [authModalLoading, setAuthModalLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ fullName: '', email: '', password: '' });
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].code);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filtered models based on user subscription
  const filteredModels = AVAILABLE_MODELS.filter(model => !model.premium || (user && user.subscription === 'pro'));

  // Check if user has active subscription
  const hasActiveSubscription = user?.subscription === 'pro';

  const mainContentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      setIsModalOpen(false);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // User will be set by useAuth hook
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // User will be set by useAuth hook
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setMessages([]);
    setConversations([]);
    setActiveConversationId(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const updateLayout = (id: string, newConfig: Partial<LayoutElement>) => {
    setLayout(prev => ({ ...prev, [id]: { ...prev[id], ...newConfig } }));
  };

  const getSortedLayout = () => {
    return Object.entries(layout).sort(([, a], [, b]) => (a.zIndex || 0) - (b.zIndex || 0));
  };

  const getSortedElements = () => {
    return Object.entries(layout).sort(([, a], [, b]) => (a.zIndex || 0) - (b.zIndex || 0));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };

  const handleNewGame = () => {
    // Implementation for new game
    console.log('New game clicked');
  };

  const handleNewChat = () => {
    // Implementation for new chat
    console.log('New chat clicked');
  };

  const handleConversationSelect = (convId: string) => {
    setCurrentConversationId(convId);
  };

  const handleConversationDelete = (convId: string) => {
    // Implementation for deleting conversation
    console.log('Delete conversation:', convId);
  };

  const handleSearch = () => {
    // Implementation for search
    console.log('Search:', searchQuery);
  };

  const getUserInitial = () => {
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return user?.email?.split('@')[0] || 'User';
  };

  const updateCustomization = (newCustomization: Customization) => {
    setCustomization(newCustomization);
  };

  const handleRegenerateResponse = () => {
    // Implementation for regenerating response
    console.log('Regenerate response');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  const commonProps = {
    isDark,
    customization,
    onSendMessage: sendMessage,
    onNewGame: () => { },
    onNewChat: () => { },
    onLoginClick: () => { },
    onModelChange: setCurrentModel,
    availableModels: AVAILABLE_MODELS,
    filteredModels: AVAILABLE_MODELS.filter(model => !model.premium || (user && user.subscription === 'pro')),
    hasActiveSubscription: user?.subscription === 'pro',
    hasGlassEffect: hasGlassEffect()
  };

  const componentMap = {
    sidebar: Sidebar,
    mainContent: MainContent,
    chatView: ChatView
  };

  return (
    <div 
      className={`h-screen overflow-hidden ${
        isDark 
          ? 'dark bg-gray-900' 
          : hasGlassEffect() 
            ? 'glass-bg' 
            : 'bg-purple-50'
      }`}
    >
      {/* Mobile Layout - Dynamic Grid Based */}
      {isMobile ? (
        <div 
          className="h-full w-full grid relative"
          style={{
            gridTemplateColumns: `repeat(20, 1fr)`,
            gridTemplateRows: `repeat(15, 1fr)`
          }}
        >
          {isDesigner && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(21)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute top-0 bottom-0 border-l border-red-200 opacity-30"
                  style={{ left: `${(i / 20) * 100}%` }}
                />
              ))}
              {[...Array(16)].map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0 border-t border-red-200 opacity-30"
                  style={{ top: `${(i / 15) * 100}%` }}
                />
              ))}
            </div>
          )}

          {getSortedLayout().map(([id, config]) => {
            const Component = componentMap[id as keyof typeof componentMap];
            if (!Component || !config.visible) return null;

            return (
              <div
                key={id}
                className="relative"
                style={{
                  gridColumn: `${config.x + 1} / ${Math.min(config.x + config.width + 1, maxX + 1)}`,
                  gridRow: `${config.y + 1} / ${Math.min(config.y + config.height + 1, maxY + 1)}`,
                  zIndex: config.zIndex
                }}
              >
                <Component
                  key={id}
                  {...commonProps}
                  // Add any specific props for each component here
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Layout - Dynamic Grid Container */
      <div 
        className="h-full w-full grid relative"
        style={{
          gridTemplateColumns: `repeat(${maxX}, 1fr)`,
          gridTemplateRows: `repeat(${maxY}, 1fr)`
        }}
      >
        {/* Render elements in z-index order (lowest to highest) */}
        {getSortedElements().map(([key, config]) => {
          const elementKey = key as keyof ExtendedLayoutConfig;
          
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
                      : customization.primaryColor,
                    boxShadow: `0 2px 12px 0 ${customization.primaryColor}22`,
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
                  onNewChat={handleNewChat}
                  detachedMode={true} // New prop to indicate detached components
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onConversationSelect={handleConversationSelect}
                  onConversationDelete={handleConversationDelete}
                  hasGlassEffect={hasGlassEffect()}
                  isLoggedIn={!!user}
                />
              )}

              {/* App Logo - Detached from sidebar */}
              {elementKey === 'appLogo' && (
                <div 
                  className={`h-full w-full ${
                    hasGlassEffect() && !isDark 
                      ? 'glass-element' 
                      : isDark 
                        ? 'bg-gray-900' 
                        : 'bg-purple-50'
                  } flex items-center justify-center`}
                  style={{
                    background: !hasGlassEffect() && customization.gradientEnabled && !isDark 
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
                  className={`h-full w-full ${
                    hasGlassEffect() && !isDark 
                      ? 'glass-element' 
                      : isDark 
                        ? 'bg-gray-900' 
                        : 'bg-purple-50'
                  } flex items-center justify-center p-2`}
                  style={{
                    background: !hasGlassEffect() && customization.gradientEnabled && !isDark 
                      ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                      : undefined
                  }}
                >
                  <button 
                    onClick={handleNewGame}
                    className={`w-full py-3 px-4 ${
                      hasGlassEffect() ? 'glass-button-modern text-gray-800' : 'rounded-lg'
                    } font-medium flex items-center justify-center gap-2 transition-colors ${
                      hasGlassEffect() ? 'hover:text-gray-900' : 'text-white hover:opacity-90'
                    }`}
                    style={{ 
                      background: !hasGlassEffect() 
                        ? (customization.gradientEnabled 
                            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                            : customization.primaryColor)
                        : undefined,
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
                  className={`h-full w-full ${
                    hasGlassEffect() && !isDark 
                      ? 'glass-element' 
                      : isDark 
                        ? 'bg-gray-900' 
                        : 'bg-purple-50'
                  } flex items-center justify-center p-2`}
                  style={{
                    background: !hasGlassEffect() && customization.gradientEnabled && !isDark 
                      ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                      : undefined
                  }}
                >
                  <button 
                    onClick={handleNewChat}
                    className={`w-full py-3 px-4 ${
                      hasGlassEffect() ? 'glass-button-modern text-gray-800' : 'rounded-lg'
                    } font-medium flex items-center justify-center gap-2 transition-colors ${
                      hasGlassEffect() ? 'hover:text-gray-900' : 'text-white hover:opacity-90'
                    }`}
                    style={{ 
                      background: !hasGlassEffect() 
                        ? (customization.gradientEnabled 
                            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                            : customization.primaryColor)
                        : undefined,
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
                <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-purple-50'} flex items-center justify-center px-2`}>
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
                <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-purple-50'} flex items-center justify-center`}>
                  <button 
                    onClick={toggleAccountMenu}
                    className={`w-full h-full flex items-center justify-center gap-2 transition-colors ${
                      isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-purple-600 hover:bg-purple-100'
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
                      {getUserInitial()}
                    </div>
                    <div className="text-xs">{getUserDisplayName()}</div>
                  </button>
                </div>
              )}

              {/* Main Content Area */}
              {elementKey === 'mainContent' && (
                <div className={`h-full w-full ${
                  hasGlassEffect() && !isDark 
                    ? 'glass-element' 
                    : isDark 
                      ? 'bg-gray-900' 
                      : 'bg-purple-50'
                }`}>
                  {messages.length === 0 ? (
                    <MainContent 
                      isDark={isDark} 
                      onSendMessage={sendMessage}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      availableModels={filteredModels}
                      customization={customization}
                      isLoggedIn={!!user}
                      onLoginClick={() => setShowLoginModal(true)}
                      // Alleen input tonen als er geen inputBox in layout is of als we mobiel zijn
                      hideInput={!!layout.inputBox && !isMobile}
                      hasGlassEffect={hasGlassEffect()}
                      hasActiveSubscription={hasActiveSubscription}
                    />
                  ) : !isMobile && (
                    <ChatView 
                      isDark={isDark} 
                      messages={messages}
                      onSendMessage={sendMessage}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      availableModels={filteredModels}
                      hideInput={true}
                      customization={customization}
                      isGenerating={isGenerating}
                      conversationId={currentConversationId || undefined}
                      conversationTitle={conversationTitle}
                      isLoggedIn={!!user}
                      onLoginClick={() => setShowLoginModal(true)}
                      error={chatError}
                      setError={setChatError}
                      onRegenerateResponse={() => handleRegenerateResponse()}
                    />
                  )}
                </div>
              )}

              {/* Input Box - Only shows input controls on desktop */}
              {elementKey === 'inputBox' && !isMobile && (
                <div className={`h-full w-full ${
                  hasGlassEffect() && !isDark 
                    ? 'glass-element' 
                    : isDark 
                      ? 'bg-gray-900' 
                      : 'bg-purple-50'
                } p-4`}>
                  <div className="h-full flex items-end">
                    <div className="w-full">
                      {/* Anonymous Usage Indicator */}
                      {!user && (
                        <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-orange-50 border-orange-200'} border`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-orange-400' : 'bg-orange-500'}`}></div>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-orange-700'}`}>
                              Anonymous mode - limited messages
                            </span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.querySelector('textarea') as HTMLTextAreaElement;
                        if (input?.value.trim()) {
                          sendMessage(input.value);
                          input.value = '';
                        }
                      }}>
                        {/* Message Input Container */}
                        <div className={`relative rounded-2xl ${
                          hasGlassEffect() && !isDark 
                            ? 'glass-input' 
                            : `border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-purple-200'} shadow-sm`
                        }`}>
                          <textarea
                            placeholder="Type your message here..."
                            className={`w-full px-6 py-4 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                              hasGlassEffect() && !isDark 
                                ? 'bg-transparent text-gray-800 placeholder-gray-600' 
                                : isDark 
                                  ? 'bg-gray-700 text-white placeholder-gray-400' 
                                  : 'bg-white text-gray-900 placeholder-gray-500'
                            }`}
                            style={{ fontFamily: customization.fontFamily }}
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                sendMessage(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          
                          {/* Bottom Controls */}
                          <div className="flex items-center justify-between px-6 pb-4">
                            <div className="flex items-center gap-4">
                              {/* Model Selector */}
                              <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                                availableModels={filteredModels}
                                isDark={isDark}
                                customization={customization}
                                hasActiveSubscription={hasActiveSubscription}
                              />
                              {/* Search Button */}
                              {user && (
                                <button 
                                  type="button"
                                  onClick={() => setIsSearchFocused(true)}
                                  className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                                  style={{ color: isDark ? undefined : customization.primaryColor }}
                                  title="Search chat history"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                            
                            {/* Send Button */}
                            <button 
                              type="submit"
                              className={`${
                                hasGlassEffect() && !isDark 
                                  ? 'glass-button-modern text-gray-800' 
                                  : 'text-white'
                              } p-2.5 rounded-xl transition-colors hover:opacity-90`}
                              style={{ 
                                background: !hasGlassEffect() 
                                  ? (customization.gradientEnabled 
                                      ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                                      : customization.primaryColor)
                                  : undefined
                              }}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4,12l1.41,1.41L11,7.83V20h2V7.83l5.58,5.59L20,12l-8-8L4,12z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
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

              {/* Login Button - Shows when not authenticated */}
              {elementKey === 'loginButton' && !user && (
                <div className="h-full w-full flex items-center justify-center">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    title="Login"
                  >
                    {authModalLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}

              {/* Signup Button - Shows when not authenticated */}
              {elementKey === 'signupButton' && !user && (
                <div className="h-full w-full flex items-center justify-center">
                  <button
                    onClick={() => setShowSignupModal(true)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    title="Sign Up"
                  >
                    {authModalLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}

              {/* Account Button - Shows when authenticated */}
              {elementKey === 'accountButton' && user && (
                <div className="h-full w-full flex items-center justify-center">
                  <button
                    onClick={toggleAccountMenu}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    title={`Account: ${user?.email}`}
                  >
                    <User className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Search Modal - Fixed positioning with high z-index */}
      {isSearchFocused && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSearchFocused(false);
              setSearchResults([]);
              setSearchQuery('');
            }
          }}
        >
          <div 
            className={`w-[500px] max-w-[90vw] max-h-[80vh] p-6 rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Zoek in Chat Geschiedenis
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek in je conversaties..."
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
                    setSearchResults([]);
                    setSearchQuery('');
                  }
                }}
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="flex-1 py-2 px-4 rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ 
                    background: customization.gradientEnabled 
                      ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                      : customization.primaryColor
                  }}
                >
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
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

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {searchResults.length} results found
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        handleConversationSelect(result.conversation.id);
                        setIsSearchFocused(false);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.conversation.title || 'Untitled Conversation'}
                      </div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {result.type === 'title' ? 'Title match' : `${result.matchCount} messages found`}
                      </div>
                      {result.type === 'content' && result.messages && (
                        <div className={`text-xs mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {result.messages[0].content.length > 100 
                            ? result.messages[0].content.substring(0, 100) + '...'
                            : result.messages[0].content
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className={`mt-6 text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}
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
              Sign In to BelloSai
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
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
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
              onOpenAPIKeyManager={() => {
                setIsAccountMenuOpen(false);
                setShowAPIKeyManager(true);
              }}
            />
          </div>
        </div>
      )}

      {/* API Key Manager Modal */}
      <APIKeyManager
        isDark={isDark}
        isOpen={showAPIKeyManager}
        onClose={() => setShowAPIKeyManager(false)}
      />
    </div>
  );
}

const AppWrapper: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <MessageProvider>
        <App />
      </MessageProvider>
    </ThemeProvider>
  </AuthProvider>
);

export default AppWrapper;