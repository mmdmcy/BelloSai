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
 * 
 * State Management:
 * - Layout configuration for responsive grid system
 * - Theme and customization settings
 * - Chat messages and conversation history
 * - UI state (modals, sidebars, etc.)
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { sendChatMessage, DeepSeekModel, ChatMessage } from './lib/supabase-chat';
import { chatFeaturesService } from './lib/chat-features';
import { anonymousUsageService } from './lib/anonymous-usage';
import { layoutManager, ExtendedLayoutConfig, MobileLayoutConfig, defaultMobileLayout } from './lib/auth-integration'
import { StripeService } from './lib/stripeService';
import { LogIn, UserPlus, User, Loader2, Menu, X } from 'lucide-react'
import { useSubscription } from './hooks/useSubscription';

/**
 * Message Interface
 * Defines the structure of chat messages in the application
 */
export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  model?: string; // modelcode zoals 'models/gemini-2.0-flash'
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
  selectedTheme: string;
}

/**
 * Theme Interface
 * Defines the structure of aesthetic themes
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColors: string[];
  gradientEnabled: boolean;
  fontFamily: string;
  borderRadius: string;
  shadows: boolean;
  glassEffect: boolean;
  retroMode: boolean;
}

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

export const AVAILABLE_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Modern Purple',
    description: 'The classic BelloSai look with purple gradients',
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    backgroundColor: '#f9fafb',
    textColor: '#1f2937',
    accentColors: ['#8b5cf6', '#d946ef'],
    gradientEnabled: false,
    fontFamily: 'Inter',
    borderRadius: '0.75rem',
    shadows: true,
    glassEffect: false,
    retroMode: false
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Elegant glass effects with modern translucent design',
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    backgroundColor: 'linear-gradient(135deg, #a7f3d0 0%, #7dd3fc 35%, #93c5fd 100%)',
    textColor: '#0f172a',
    accentColors: ['#06b6d4', '#0891b2', '#0e7490', '#67e8f9'],
    gradientEnabled: true,
    fontFamily: 'SF Pro Display, -apple-system, system-ui',
    borderRadius: '1.25rem',
    shadows: true,
    glassEffect: true,
    retroMode: false
  },
  {
    id: 'frutiger-aero',
    name: 'Cloud Nine',
    description: 'Airy and translucent with soft blues and nature vibes',
    primaryColor: '#0ea5e9',
    secondaryColor: '#06b6d4',
    backgroundColor: '#f0f9ff',
    textColor: '#0f172a',
    accentColors: ['#38bdf8', '#22d3ee', '#67e8f9'],
    gradientEnabled: true,
    fontFamily: 'SF Pro Display, system-ui',
    borderRadius: '1rem',
    shadows: true,
    glassEffect: true,
    retroMode: false
  },
  {
    id: 'vista-glass',
    name: 'Vista Elegance',
    description: 'Sophisticated glass effects with subtle animations',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    accentColors: ['#2563eb', '#60a5fa', '#93c5fd'],
    gradientEnabled: true,
    fontFamily: 'Segoe UI, system-ui',
    borderRadius: '0.5rem',
    shadows: true,
    glassEffect: true,
    retroMode: false
  },
  {
    id: 'retro-computing',
    name: 'Terminal Classic',
    description: 'Nostalgic computing with monospace fonts and sharp edges',
    primaryColor: '#22c55e',
    secondaryColor: '#16a34a',
    backgroundColor: '#0a0a0a',
    textColor: '#00ff00',
    accentColors: ['#00ff00', '#ffff00', '#00ffff'],
    gradientEnabled: false,
    fontFamily: 'Courier New, monospace',
    borderRadius: '0',
    shadows: false,
    glassEffect: false,
    retroMode: true
  },
  {
    id: 'cupertino',
    name: 'Cupertino Style',
    description: 'Clean and minimal with system-inspired design',
    primaryColor: '#007aff',
    secondaryColor: '#5ac8fa',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColors: ['#007aff', '#5ac8fa', '#ff3b30'],
    gradientEnabled: false,
    fontFamily: 'SF Pro Display, -apple-system, system-ui',
    borderRadius: '0.875rem',
    shadows: true,
    glassEffect: false,
    retroMode: false
  },
  {
    id: 'synthwave',
    name: 'Neon Dreams',
    description: 'Retro-futuristic with vibrant neons and dark backgrounds',
    primaryColor: '#ff0080',
    secondaryColor: '#00ffff',
    backgroundColor: '#0d1117',
    textColor: '#ffffff',
    accentColors: ['#ff0080', '#00ffff', '#ff6b00', '#8000ff'],
    gradientEnabled: true,
    fontFamily: 'Orbitron, monospace',
    borderRadius: '0.25rem',
    shadows: true,
    glassEffect: false,
    retroMode: true
  },
  {
    id: 'nature-green',
    name: 'Forest Zen',
    description: 'Calming greens inspired by nature and sustainability',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    backgroundColor: '#f0fdf4',
    textColor: '#064e3b',
    accentColors: ['#059669', '#10b981', '#34d399'],
    gradientEnabled: true,
    fontFamily: 'Inter, system-ui',
    borderRadius: '1rem',
    shadows: true,
    glassEffect: false,
    retroMode: false
  },
  {
    id: 'warm-sunset',
    name: 'Golden Hour',
    description: 'Warm oranges and reds like a beautiful sunset',
    primaryColor: '#ea580c',
    secondaryColor: '#f97316',
    backgroundColor: '#fff7ed',
    textColor: '#9a3412',
    accentColors: ['#ea580c', '#f97316', '#fb923c'],
    gradientEnabled: true,
    fontFamily: 'Inter, system-ui',
    borderRadius: '0.75rem',
    shadows: true,
    glassEffect: false,
    retroMode: false
  }
];

function App() {
  // Use Supabase auth context
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Theme state - controls light/dark mode
  // Dark mode state with localStorage persistence
  const [isDark, setIsDark] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('bellosai-dark-mode');
      return savedTheme ? JSON.parse(savedTheme) : false;
    } catch (error) {
      console.log('Failed to load theme from localStorage:', error);
      return false;
    }
  });
  
  // Designer mode state - enables/disables layout editing
  const [isDesignerMode, setIsDesignerMode] = useState(false);
  
  // Account menu visibility state
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  
  // Sidebar collapse state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const savedSidebarState = localStorage.getItem('bellosai-sidebar-collapsed');
      return savedSidebarState ? JSON.parse(savedSidebarState) : false;
    } catch (error) {
      console.log('Failed to load sidebar state from localStorage:', error);
      return false;
    }
  });
  
  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Current view state - switches between chat and game modes
  const [currentView, setCurrentView] = useState<'chat' | 'game'>('chat');
  
  // Chat messages array
  const [messages, setMessages] = useState<Message[]>([]);
  
  // AI model selection with localStorage persistence
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      const savedModel = localStorage.getItem('bellosai-selected-model');
      return savedModel || 'DeepSeek-V3'; // Default to DeepSeek V3 (not R1)
    } catch (error) {
      console.log('Failed to load selected model from localStorage:', error);
      return 'DeepSeek-V3'; // Default to DeepSeek V3 (not R1)
    }
  });
  
  // Message counter for AI response logic
  const [messageCount, setMessageCount] = useState(0);
  
  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Chat error state
  const [chatError, setChatError] = useState<string | null>(null);

  // Conversation management
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState('Untitled Conversation');
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationCache, setConversationCache] = useState<Map<string, Message[]>>(new Map());

  // Search state for detached search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  // User customization settings with localStorage persistence
  const [customization, setCustomization] = useState<CustomizationSettings>(() => {
    try {
      const savedCustomization = localStorage.getItem('bellosai-customization');
      if (savedCustomization) {
        const parsed = JSON.parse(savedCustomization);
        console.log('🔄 Loaded customization from localStorage:', parsed);
        // Ensure all required properties exist with fallbacks
        return {
          showQuestions: parsed.showQuestions ?? true,
          primaryColor: parsed.primaryColor ?? '#7c3aed',
          secondaryColor: parsed.secondaryColor ?? '#a855f7',
          fontFamily: parsed.fontFamily ?? 'Inter',
          gradientEnabled: parsed.gradientEnabled ?? false,
          gradientColors: parsed.gradientColors ?? ['#7c3aed', '#a855f7'],
          selectedTheme: parsed.selectedTheme ?? 'default'
        };
      }
    } catch (error) {
      console.log('Failed to load customization from localStorage:', error);
    }
    
    // Default values if nothing in localStorage
    console.log('🎨 Using default customization settings');
    return {
      showQuestions: true,
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      fontFamily: 'Inter',
      gradientEnabled: false,
      gradientColors: ['#7c3aed', '#a855f7'],
      selectedTheme: 'default'
    };
  });

  // Authentication modals and forms
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAPIKeyManager, setShowAPIKeyManager] = useState(false);
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
  const availableModels: ModelInfo[] = AVAILABLE_MODELS;

  // Save customization to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bellosai-customization', JSON.stringify(customization));
      console.log('💾 Customization saved to localStorage:', customization);
    } catch (error) {
      console.error('Failed to save customization to localStorage:', error);
    }
  }, [customization]);

  // Save dark mode preference to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bellosai-dark-mode', JSON.stringify(isDark));
    } catch (error) {
      console.error('Failed to save dark mode to localStorage:', error);
    }
  }, [isDark]);

  // Save selected model to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bellosai-selected-model', selectedModel);
    } catch (error) {
      console.error('Failed to save selected model to localStorage:', error);
    }
  }, [selectedModel]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bellosai-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage:', error);
    }
  }, [isSidebarCollapsed]);

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

  // Sync layout when user logs in
  useEffect(() => {
    if (user) {
      // User is logged in, try to sync their layout from cloud
      const syncLayout = async () => {
        try {
          // For now, just use the default layout
          // TODO: Implement cloud layout sync with Supabase
          console.log('User logged in, using default layout');
        } catch (error) {
          console.log('No cloud layout found, using current layout');
        }
      };
      syncLayout();
    }
  }, [user]);

  // Load conversations when user logs in
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [user]);

  // Add session health check when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        console.log('👀 Tab became visible, checking app health...');
        
        // Simple health check - try to get conversations
        try {
          await chatFeaturesService.getUserConversations(user.id);
          console.log('✅ App health check passed');
        } catch (error) {
          console.warn('⚠️ App health check failed, may need session refresh:', error);
          
          // If it's an auth error, try to refresh
          if (error instanceof Error && (
            error.message.includes('Authentication') ||
            error.message.includes('Invalid') ||
            error.message.includes('expired')
          )) {
            console.log('🔄 Attempting session refresh...');
            try {
              await supabase.auth.refreshSession();
              console.log('✅ Session refreshed successfully');
            } catch (refreshError) {
              console.error('❌ Failed to refresh session:', refreshError);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Check for successful checkout session in URL parameters
  useEffect(() => {
    const checkForCheckoutSuccess = async () => {
      if (!user) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        console.log('🔄 [App] Detected Stripe session_id in URL, syncing subscription...');
        
        try {
          // Force sync subscription from Stripe
          const syncSuccess = await StripeService.forceSyncSubscription();
          
          if (syncSuccess) {
            console.log('✅ [App] Subscription synced successfully');
            
            // Optional: Show success message
            // You could add a toast notification here
          } else {
            console.warn('⚠️ [App] Subscription sync failed, but checkout may still be processing');
          }
        } catch (error) {
          console.error('❌ [App] Error syncing subscription:', error);
        }
        
        // Clean URL to remove session_id parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('session_id');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };
    
    checkForCheckoutSuccess();
  }, [user]);

  const loadConversations = async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    
    try {
      // Clean up duplicates for all conversations on startup
      await chatFeaturesService.removeDuplicateMessages();
      
      const userConversations = await chatFeaturesService.getUserConversations(user.id);
      setConversations(userConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // If tables don't exist yet, just set empty array
      setConversations([]);
    }
  };



  // Authentication handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return;

    setAuthModalLoading(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;

      setShowLoginModal(false);
      setLoginForm({ email: '', password: '' });
    } catch (error: any) {
      setAuthError(error.message || 'Login failed');
    } finally {
      setAuthModalLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.email || !signupForm.password) return;

    setAuthModalLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            full_name: signupForm.fullName,
          },
        },
      });

      if (error) throw error;
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        setAuthError(`Please check your email (${signupForm.email}) and click the confirmation link to complete your registration.`);
        // Clear the form but keep modal open to show the message
        setSignupForm({ email: '', password: '', fullName: '' });
      } else {
        // User is immediately signed in (email confirmation disabled)
        setShowSignupModal(false);
        setSignupForm({ email: '', password: '', fullName: '' });
      }
    } catch (error: any) {
      setAuthError(error.message || 'Sign up failed');
    } finally {
      setAuthModalLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAccountMenuOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
   * Toggle mobile menu visibility
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Handle sending a new message
   * Creates user message and gets AI response from DeepSeek
   * Supports both authenticated and anonymous users
   */
  const sendMessage = async (content: string, regenerate = false, targetModel?: string) => {
    console.log('📨 sendMessage called with:', { content, regenerate, targetModel });
    
    // Performance optimization: Early validation
    if (!content.trim() && !regenerate) {
      console.warn('⚠️ Empty message content, aborting');
      return;
    }

    if (isGenerating) {
      console.warn('⚠️ Already generating, aborting new request');
      return;
    }

    // Check anonymous usage limit for non-logged-in users
    if (!user && !regenerate) {
      console.log('🔍 Checking anonymous usage for non-logged-in user...');
      const canSend = anonymousUsageService.canSendMessage();
      const stats = anonymousUsageService.getStats();
      console.log('📊 Anonymous usage stats:', stats);
      console.log('✅ Can send message:', canSend);
      
      if (!canSend) {
        console.warn('⚠️ Anonymous user has reached daily limit or rate limit');
        setChatError('Daily message limit reached. Create an account to get more messages!');
        return;
      }
    }

    // Clear any existing errors
    setChatError(null);

    // Use target model if provided, otherwise use selected model
    const modelToUse = targetModel || selectedModel;
    if (!modelToUse) {
      console.error('❌ No model selected');
      setChatError('Geen model geselecteerd. Selecteer een AI model om te chatten.');
      return;
    }

    let aiMessageId: string | null = null;

    try {
      console.log('🚀 Starting message send process...');
      
      // Add user message to UI (only if not regenerating)
      let userMessageId: string | null = null;
      if (!regenerate) {
        userMessageId = Date.now().toString();
        const userMessage: Message = {
          id: userMessageId,
          type: 'user',
          content: content.trim(),
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        console.log('✅ User message added to UI');
      } else {
        console.log('🔄 Regenerating - skipping user message');
      }

      // Prepare chat messages for API
      const currentMessages = !regenerate ? 
        [...messages, { id: userMessageId!, type: 'user' as const, content: content.trim(), timestamp: new Date() }] :
        messages;
        
      const chatMessages = currentMessages
        .filter(msg => msg.content.trim() !== '')
        .map(msg => ({
          type: msg.type,
          content: msg.content
        }));
      
      console.log('📋 Prepared chat messages:', chatMessages.length);
      
      // Get current conversation ID
      const currentConvoId = regenerate ? currentConversationId : (currentConversationId || crypto.randomUUID());
      if (!regenerate && !currentConversationId) {
        setCurrentConversationId(currentConvoId);
        console.log('🆔 Generated new conversation ID:', currentConvoId);
      }
      
      // Increment message count
      setMessageCount(prev => prev + 1);
      
      // Create AI message placeholder for streaming with optimized initial state
      console.log('🤖 Creating AI message placeholder...');
      aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        model: modelToUse // store model code
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(true);
      console.log('🔄 Set isGenerating to true');

      // No timeouts - AI can take as long as it needs!

      // Early conversation title generation for better UX
      if (!regenerate && currentMessages.length <= 2 && conversationTitle === 'Untitled Conversation') {
        // Generate title in background without blocking the main request
        setTimeout(async () => {
          try {
            const title = await chatFeaturesService.generateConversationTitle(
              chatMessages.map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content }))
            );
            if (title && title !== 'New Conversation') {
              // Update both local state AND database
              setConversationTitle(title);
              if (currentConvoId) {
                await chatFeaturesService.updateConversationTitle(currentConvoId, title);
              }
              console.log('✅ Generated conversation title in database:', title);
            }
          } catch (titleError) {
            console.warn('⚠️ Failed to generate title:', titleError);
          }
        }, 100); // Small delay to not interfere with main request
      }
      
      // Validation checks
      if (!chatMessages || chatMessages.length === 0) {
        throw new Error('No chat messages available for sending');
      }
      
      if (!modelToUse) {
        throw new Error('No model selected');
      }
      
      console.log('✅ Pre-flight checks passed, calling sendChatMessage...');
      console.log('📡 Calling sendChatMessage with parameters:');
      console.log('  - Messages count:', chatMessages.length);
      console.log('  - Model:', modelToUse);
      console.log('  - AI Message ID:', aiMessageId);
      console.log('  - Conversation ID:', currentConvoId);
      console.log('🚀 Starting sendChatMessage call...');

      // Direct streaming without buffering for immediate display
      let fullResponse = '';

      try {
        fullResponse = await sendChatMessage(
          chatMessages,
          modelToUse,
          (chunk: string) => {
            if (!chunk) return;
            
            // Direct UI update - no throttling or buffering
            console.log('📦 Direct chunk update:', chunk.length, 'chars');
            
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: msg.content + chunk, model: modelToUse }
                : msg
            ));
          },
          currentConvoId || undefined
        );
        
        console.log('✅ sendChatMessage completed successfully');
        console.log('📝 Full response length:', fullResponse?.length || 0);

        // Set generating to false since request completed successfully
        setIsGenerating(false);

        // Validate response
        if (!fullResponse || fullResponse.trim() === '') {
          throw new Error('Empty response received from AI service');
        }

        console.log('💾 Saving messages to database...');
        
        // Save messages to database - CRITICAL: Make this synchronous to ensure all messages are saved
        if (user && currentConvoId) {
          try {
            console.log('💾 Saving messages to database (synchronous)...');
            
            // First ensure conversation exists in database
            console.log('🔄 Ensuring conversation exists in database...');
            try {
              const userConversations = await chatFeaturesService.getUserConversations(user.id);
              const existingConvo = userConversations.find(conv => conv.id === currentConvoId);
              if (!existingConvo) {
                console.log('📝 Creating new conversation in database...');
                await chatFeaturesService.createConversationWithId(currentConvoId, user.id, conversationTitle || 'New Conversation', modelToUse);
                console.log('✅ Conversation created in database');
              }
            } catch (convoError) {
              console.log('📝 Creating conversation (error checking):', convoError);
              try {
                await chatFeaturesService.createConversationWithId(currentConvoId, user.id, conversationTitle || 'New Conversation', modelToUse);
                console.log('✅ Conversation created in database');
              } catch (createError) {
                console.error('❌ Failed to create conversation:', createError);
                // Continue anyway - we can save messages without conversation
              }
            }

            // Save user message (if not regenerating) - CRITICAL
            if (!regenerate && userMessageId) {
              try {
                await chatFeaturesService.saveMessage(
                  currentConvoId,
                  'user',
                  content.trim()
                );
                console.log('✅ User message saved to database');
              } catch (userSaveError) {
                console.error('❌ CRITICAL: Failed to save user message:', userSaveError);
              }
            }

            // Save AI response - CRITICAL
            try {
              await chatFeaturesService.saveMessage(
                currentConvoId,
                'assistant',
                fullResponse,
                modelToUse
              );
              console.log('✅ AI response saved to database');
            } catch (aiSaveError) {
              console.error('❌ CRITICAL: Failed to save AI response:', aiSaveError);
              // Retry once
              try {
                console.log('🔄 Retrying AI message save...');
                await chatFeaturesService.saveMessage(
                  currentConvoId,
                  'assistant',
                  fullResponse,
                  modelToUse
                );
                console.log('✅ AI response saved to database (retry successful)');
              } catch (retryError) {
                console.error('❌ CRITICAL: AI message save retry failed:', retryError);
              }
            }

            // Update conversation title if needed (background task)
            if (conversationTitle === 'Untitled Conversation' || !conversationTitle) {
              try {
                const title = await chatFeaturesService.generateConversationTitle(
                  chatMessages.concat([{ type: 'ai', content: fullResponse }])
                    .map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content }))
                );
                if (title && title !== 'New Conversation') {
                  // Update both local state AND database
                  setConversationTitle(title);
                  await chatFeaturesService.updateConversationTitle(currentConvoId, title);
                  console.log('✅ Updated conversation title in database:', title);
                }
              } catch (titleError) {
                console.warn('⚠️ Failed to update conversation title:', titleError);
              }
            }

            // Refresh conversations list (background)
            loadConversations().then(() => {
              console.log('✅ Conversations list refreshed');
            }).catch(err => {
              console.warn('⚠️ Failed to refresh conversations:', err);
            });
            
          } catch (saveError) {
            console.error('❌ CRITICAL: Error in message saving process:', saveError);
          }
        }
        
        // Update with final response (ensure content and model are set correctly)
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fullResponse, model: modelToUse }
            : msg
        ));
        
        console.log('✅ Final message update completed with model:', modelToUse);

        // Record anonymous usage for non-logged-in users (only for new messages, not regenerated ones)
        if (!user && !regenerate) {
          const recorded = anonymousUsageService.recordMessage();
          console.log('📊 Anonymous usage recorded:', recorded);
        }

      } catch (streamError) {
        console.error('❌ Streaming error:', streamError);
        throw streamError; // Re-throw to be handled by outer catch
      }

      } catch (error) {
    console.error('❌ Message sending failed:', error);
      
      // Enhanced error handling with better user messages
      let errorMessage = 'An error occurred while processing your message.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = 'The request took too long. Please try again with a shorter question.';
        } else if (error.message.includes('limit') || error.message.includes('Limit')) {
          errorMessage = 'You have reached your message limit. Please upgrade your account for more messages.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('auth') || error.message.includes('token')) {
          errorMessage = 'Authentication error. Please log in again and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setChatError(errorMessage);
      
      // Update AI message with error (if message was created)
      if (aiMessageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: errorMessage
              }
            : msg
        ));
      }
      } finally {
    setIsGenerating(false);
  }
  };

  /**
   * Regenerate the last AI response with the same or different model
   */
  const handleRegenerateResponse = useCallback(async (targetModel?: string) => {
    if (isGenerating || messages.length === 0) return;
    
    console.log('🔄 Regenerating response...');
    
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (!lastUserMessage) {
      console.warn('⚠️ No user message found to regenerate response');
      return;
    }
    
    console.log('✅ Found last user message:', lastUserMessage.content);
    
    // Remove the last AI message if it exists
    const filteredMessages = messages.filter((msg, index) => {
      if (index === messages.length - 1 && msg.type === 'ai') {
        console.log('🗑️ Removing last AI message for regeneration');
        return false; // Remove last AI message
      }
      return true;
    });
    
    setMessages(filteredMessages);
    
    // Regenerate with the last user message
    console.log('🔄 Calling sendMessage with regenerate=true');
    await sendMessage(lastUserMessage.content, true, targetModel || selectedModel);
  }, [messages, isGenerating, sendMessage, selectedModel]);

  /**
   * Handle new chat creation
   */
  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setConversationTitle('Untitled Conversation');
    setIsGenerating(false); // Reset generating state
    setIsLoadingConversation(false); // Reset loading state
    
    // Clear all cache when starting new chat to ensure fresh data
    setConversationCache(new Map());
    
    console.log('🆕 New chat started - all states reset');
  };

  /**
   * Force refresh conversation messages (clear cache and reload)
   */
  const refreshConversationMessages = async (conversationId: string) => {
    if (!user || !conversationId) return;
    
    console.log('🔄 Force refreshing conversation messages:', conversationId);
    
    // Since we always load fresh data now, just call handleConversationSelect
    await handleConversationSelect(conversationId);
  };

  /**
   * Handle conversation selection from sidebar
   */
  const handleConversationSelect = async (conversationId: string) => {
    if (!user) {
      console.log('❌ No user authenticated for conversation selection');
      return;
    }
    
    console.log('🔘 Conversation clicked:', conversationId, 'Current:', currentConversationId);
    
    // If clicking the same conversation and it's already loaded, allow reload if user wants
    if (currentConversationId === conversationId && messages.length > 0 && !isLoadingConversation) {
      console.log('✅ Same conversation clicked - allowing reload');
      // Don't return early - allow the reload
    }
    
    // Prevent multiple simultaneous loads for the same conversation
    if (isLoadingConversation && currentConversationId === conversationId) {
      console.log('⚠️ Already loading this conversation, ignoring request');
      return;
    }
    
    // Reset generating state when switching conversations
    setIsGenerating(false);
    setIsLoadingConversation(true);
    
    // Find conversation title first
    const conversation = conversations.find(c => c.id === conversationId);
    
    setCurrentConversationId(conversationId);
    setConversationTitle(conversation?.title || 'Loading conversation...');
    
    try {
      // Always fetch fresh data from database with timeout protection
      console.log('🔄 Loading fresh messages from database for:', conversationId);
      
      // Direct query with built-in timeout handling
      const conversationMessages = await chatFeaturesService.getConversationMessages(conversationId);
      
      if (conversationMessages && conversationMessages.length > 0) {
        // Convert to Message format with model information
        const convertedMessages: Message[] = conversationMessages.map((msg: any) => ({
          id: msg.id,
          type: (msg.role || msg.type) === 'user' ? 'user' : 'ai',
          content: msg.content || '',
          timestamp: new Date(msg.created_at),
          model: msg.model // Include model information for AI messages
        }));
        
        console.log('✅ Loaded', convertedMessages.length, 'messages from database');
        setMessages(convertedMessages);
        
        // Update cache with fresh data
        setConversationCache(prev => new Map(prev.set(conversationId, convertedMessages)));
      } else {
        console.log('⚠️ No messages found in database for conversation:', conversationId);
        setMessages([]);
        // Cache empty array too
        setConversationCache(prev => new Map(prev.set(conversationId, [])));
      }
      
      // Update title once loaded
      setConversationTitle(conversation?.title || 'Untitled Conversation');
      console.log('✅ Conversation loaded successfully:', conversationId);
      
    } catch (error) {
      console.error('❌ Failed to load conversation messages:', error);
      
      // Show specific error messages based on error type
      let errorMessage = 'Conversation (failed to load)';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Conversation (timeout)';
          console.log('⏰ Database query timed out for conversation:', conversationId);
        } else if (error.message.includes('network')) {
          errorMessage = 'Conversation (network error)';
        }
      }
      
      // Clear messages and show error state
      setMessages([]);
      setConversationTitle(conversation?.title || errorMessage);
      
      // Also clear from cache if it failed to load
      setConversationCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(conversationId);
        return newCache;
      });
      
    } finally {
      // CRITICAL: Always reset loading state
      setIsLoadingConversation(false);
      console.log('🔄 Loading state reset for conversation:', conversationId);
      
      // Force UI update to ensure loading state is cleared
      setTimeout(() => {
        setIsLoadingConversation(false);
      }, 100);
    }
  };

  /**
   * Handle conversation deletion from sidebar
   */
  const handleConversationDelete = async (conversationId: string) => {
    if (!user) return;
    
    try {
      console.log('Deleting conversation:', conversationId);
      
      // Delete from database
      await chatFeaturesService.deleteConversation(conversationId);
      
      // If we're currently viewing this conversation, clear the view
      if (currentConversationId === conversationId) {
        setMessages([]);
        setCurrentConversationId(null);
        setConversationTitle('Untitled Conversation');
      }
      
      // Reload conversations to update sidebar
      await loadConversations();
      
      console.log('Conversation deleted successfully');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('An error occurred while deleting the conversation.');
    }
  };

  /**
   * Regenerate the last AI response
   * Removes the last AI message and tries to generate a new response
   */


  /**
   * Handle search functionality
   */
  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) {
      return;
    }

    setIsSearching(true);
    try {
      const query = searchQuery.trim().toLowerCase();
      
      // Search through conversations (titles)
      const titleMatches = conversations.filter(conv => 
        conv.title && conv.title.toLowerCase().includes(query)
      );

      // Search through message content
      const messageMatches = [];
      for (const conv of conversations) {
        try {
          const messages = await chatFeaturesService.getConversationMessages(conv.id);
          const matchingMessages = messages.filter((msg: any) => 
            msg.content && msg.content.toLowerCase().includes(query)
          );
          
          if (matchingMessages.length > 0) {
            messageMatches.push({
              conversation: conv,
              messages: matchingMessages,
              matchCount: matchingMessages.length
            });
          }
        } catch (error) {
          console.error('Error searching conversation:', conv.id, error);
        }
      }

      // Combine results
      const results = [
        ...titleMatches.map(conv => ({
          type: 'title',
          conversation: conv,
          matchText: conv.title
        })),
        ...messageMatches.map(match => ({
          type: 'content',
          conversation: match.conversation,
          messages: match.messages,
          matchCount: match.matchCount
        }))
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Update layout configuration with automatic saving
   */
  const updateLayout = (newLayout: ExtendedLayoutConfig) => {
    const updatedLayout = {
      ...newLayout,
      designerButton: {
        ...newLayout.designerButton,
        zIndex: 999
      }
    };
    setLayout(updatedLayout);
    layoutManager.saveLayout(updatedLayout);
    
    // TODO: Save to cloud if user is authenticated
    if (user) {
      console.log('User is authenticated, layout saved locally');
      // TODO: Implement cloud sync with Supabase
    }
  };

  /**
   * Update mobile layout configuration with automatic saving
   */
  const updateMobileLayout = (newMobileLayout: MobileLayoutConfig) => {
    console.log('App - Updating mobile layout:', newMobileLayout);
    setMobileLayout(newMobileLayout);
    layoutManager.saveMobileLayout(newMobileLayout);
    
    // TODO: Save to cloud if user is authenticated
    if (user) {
      console.log('User is authenticated, mobile layout saved locally');
      // TODO: Implement cloud sync with Supabase
    }
  };

  /**
   * Update customization settings
   */
  const updateCustomization = (newSettings: Partial<CustomizationSettings>) => {
    setCustomization(prev => {
      const updated = { ...prev, ...newSettings };
      // localStorage save will be handled by the useEffect
      return updated;
    });
  };

  /**
   * Apply a theme to the customization settings
   */
  const applyTheme = (themeId: string) => {
    const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
    if (theme) {
      setCustomization(prev => {
        const updated = {
          ...prev,
          selectedTheme: themeId,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          fontFamily: theme.fontFamily,
          gradientEnabled: theme.gradientEnabled
        };
        // localStorage save will be handled by the useEffect
        return updated;
      });
    }
  };

  /**
   * Check if current theme has glass effects enabled
   */
  const getCurrentTheme = () => {
    return AVAILABLE_THEMES.find(t => t.id === customization.selectedTheme);
  };

  const hasGlassEffect = () => {
    const currentTheme = getCurrentTheme();
    return currentTheme?.glassEffect || false;
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
    // Navigate to the simple game page
    window.location.href = '/game';
  };

  // Helper functions for user display
  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const { hasActiveSubscription } = useSubscription();

  // Filter models based on subscription
  const filteredModels = hasActiveSubscription
    ? AVAILABLE_MODELS
    : AVAILABLE_MODELS.filter(m => !m.premium);

  // Render designer mode if active
  if (isDesignerMode) {
    if (isMobile) {
      return (
        <MobileDesignerMode
          isDark={isDark}
          mobileLayout={mobileLayout}
          onMobileLayoutChange={updateMobileLayout}
          onExitDesigner={() => {
            setIsDesignerMode(false);
          }}
          onToggleTheme={toggleTheme}
          customization={customization}
          onCustomizationChange={updateCustomization}
          isAuthenticated={!!user}
          onApplyTheme={applyTheme}
        />
      );
    } else {
      return (
        <DesignerMode
          isDark={isDark}
          layout={layout}
          onLayoutChange={updateLayout}
          onExitDesigner={() => {
            console.log('App - Exiting desktop designer mode, current layout:', layout);
            setIsDesignerMode(false);
          }}
          onToggleTheme={toggleTheme}
          customization={customization}
          onCustomizationChange={updateCustomization}
          onApplyTheme={applyTheme}
        />
      );
    }
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
      className={`h-screen overflow-hidden ${
        isDark 
          ? 'dark bg-gray-900' 
          : hasGlassEffect() 
            ? 'glass-bg' 
            : 'bg-purple-50'
      }`}
      style={{ 
        fontFamily: customization.fontFamily,
        background: hasGlassEffect() && !isDark 
          ? getCurrentTheme()?.backgroundColor || 'linear-gradient(135deg, #a7f3d0 0%, #7dd3fc 35%, #93c5fd 100%)'
          : undefined
      }}
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
          {/* Debug: Grid visualization */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute top-0 bottom-0 border-l border-red-200 opacity-30"
                  style={{ left: `${(i / 20) * 100}%` }}
                />
              ))}
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0 border-t border-red-200 opacity-30"
                  style={{ top: `${(i / 15) * 100}%` }}
                />
              ))}
            </div>
          )}

          {/* Mobile Header */}
          {mobileLayout.mobileHeader && (
            <div 
              className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              style={{
                gridColumn: `${mobileLayout.mobileHeader.x + 1} / ${mobileLayout.mobileHeader.x + mobileLayout.mobileHeader.width + 1}`,
                gridRow: `${mobileLayout.mobileHeader.y + 1} / ${mobileLayout.mobileHeader.y + mobileLayout.mobileHeader.height + 1}`,
                zIndex: mobileLayout.mobileHeader.zIndex,
                background: customization.gradientEnabled && !isDark 
                  ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                  : undefined
              }}
            >
              {/* Empty header container - other elements will position themselves here */}
            </div>
          )}

          {/* Mobile Menu Button - Now separate draggable */}
          {mobileLayout.mobileMenuButton && (
            <div 
              style={{
                gridColumn: `${mobileLayout.mobileMenuButton.x + 1} / ${mobileLayout.mobileMenuButton.x + mobileLayout.mobileMenuButton.width + 1}`,
                gridRow: `${mobileLayout.mobileMenuButton.y + 1} / ${mobileLayout.mobileMenuButton.y + mobileLayout.mobileMenuButton.height + 1}`,
                zIndex: mobileLayout.mobileMenuButton.zIndex
              }}
              className="flex items-center justify-center pointer-events-auto"
            >
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-3 rounded-lg transition-colors pointer-events-auto ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Mobile App Logo - Now separate draggable */}
          {mobileLayout.mobileAppLogo && (
            <div 
              style={{
                gridColumn: `${mobileLayout.mobileAppLogo.x + 1} / ${mobileLayout.mobileAppLogo.x + mobileLayout.mobileAppLogo.width + 1}`,
                gridRow: `${mobileLayout.mobileAppLogo.y + 1} / ${mobileLayout.mobileAppLogo.y + mobileLayout.mobileAppLogo.height + 1}`,
                zIndex: mobileLayout.mobileAppLogo.zIndex
              }}
              className="flex items-center justify-center pointer-events-auto"
            >
              <h1 
                className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ 
                  fontFamily: customization.fontFamily,
                  color: isDark 
                    ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                    : customization.primaryColor 
                }}
              >
                BelloSai
              </h1>
            </div>
          )}

          {/* Mobile Theme Toggle - Now separate draggable */}
          {mobileLayout.mobileThemeToggle && (
            <div 
              style={{
                gridColumn: `${mobileLayout.mobileThemeToggle.x + 1} / ${mobileLayout.mobileThemeToggle.x + mobileLayout.mobileThemeToggle.width + 1}`,
                gridRow: `${mobileLayout.mobileThemeToggle.y + 1} / ${mobileLayout.mobileThemeToggle.y + mobileLayout.mobileThemeToggle.height + 1}`,
                zIndex: mobileLayout.mobileThemeToggle.zIndex
              }}
              className="flex items-center justify-center pointer-events-auto"
            >
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-3 rounded-lg transition-colors pointer-events-auto ${
                  isDark 
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,9c1.65,0 3,1.35 3,3s-1.35,3 -3,3s-3,-1.35 -3,-3S10.35,9 12,9M12,7c-2.76,0 -5,2.24 -5,5s2.24,5 5,5s5,-2.24 5,-5S14.76,7 12,7L12,7z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z"/>
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Mobile Auth Button - Now separate draggable */}
          {mobileLayout.mobileAuthButton && (
            <div 
              style={{
                gridColumn: `${mobileLayout.mobileAuthButton.x + 1} / ${mobileLayout.mobileAuthButton.x + mobileLayout.mobileAuthButton.width + 1}`,
                gridRow: `${mobileLayout.mobileAuthButton.y + 1} / ${mobileLayout.mobileAuthButton.y + mobileLayout.mobileAuthButton.height + 1}`,
                zIndex: mobileLayout.mobileAuthButton.zIndex
              }}
              className="flex items-center justify-center pointer-events-auto"
            >
              <button
                onClick={() => user ? setIsAccountMenuOpen(true) : setShowLoginModal(true)}
                className={`px-4 py-2 rounded-lg transition-colors text-white pointer-events-auto ${
                  user ? 'hover:opacity-80' : 'hover:opacity-90'
                }`}
                style={{ 
                  background: customization.gradientEnabled 
                    ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                    : customization.primaryColor,
                  fontFamily: customization.fontFamily
                }}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {user ? 'Account' : 'Login'}
              </button>
            </div>
          )}

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="absolute inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div 
                className={`w-80 max-w-[85vw] h-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Menu
                    </h3>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      handleNewChat();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      <span className="font-medium">New Chat</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleNewGame();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.5,4A5.5,5.5 0 0,0 2,9.5C2,10.82 2.5,12 3.3,12.9L12,21.5L20.7,12.9C21.5,12 22,10.82 22,9.5A5.5,5.5 0 0,0 16.5,4C14.64,4 13,4.93 12,6.34C11,4.93 9.36,4 7.5,4V4Z"/>
                      </svg>
                      <span className="font-medium">New Game</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsSearchFocused(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                      </svg>
                      <span className="font-medium">Search Chats</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsDesignerMode(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      <span className="font-medium">Designer Mode</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Main Content - Only show when no messages */}
          {mobileLayout.mobileMainContent && messages.length === 0 && (
            <div 
              className="overflow-hidden pointer-events-auto"
              style={{
                gridColumn: `${mobileLayout.mobileMainContent.x + 1} / ${mobileLayout.mobileMainContent.x + mobileLayout.mobileMainContent.width + 1}`,
                gridRow: `${mobileLayout.mobileMainContent.y + 1} / ${mobileLayout.mobileMainContent.y + mobileLayout.mobileMainContent.height + 1}`,
                zIndex: mobileLayout.mobileMainContent.zIndex
              }}
            >
              <div 
                className={`flex-1 h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}
                style={{
                  background: customization.gradientEnabled && !isDark 
                    ? `linear-gradient(135deg, ${customization.primaryColor}05, ${customization.secondaryColor}05)`
                    : undefined
                }}
              >
                {/* Main Content Area - Responsive scaling */}
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="w-full text-center" style={{ maxWidth: '95%' }}>
                    {/* Main Heading - Responsive text size */}
                    <h1 
                      className={`text-2xl font-semibold mb-10 ${isDark ? 'text-white' : 'text-purple-800'}`}
                      style={{ 
                        fontFamily: customization.fontFamily,
                        color: isDark 
                          ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                          : customization.primaryColor 
                      }}
                    >
                      How can I help you?
                    </h1>

                    {/* Action Buttons - Responsive layout */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                      <div className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-purple-200 bg-white text-purple-700'}`}>
                        ✨ Create
                      </div>
                      <div className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-purple-200 bg-white text-purple-700'}`}>
                        🧭 Explore
                      </div>
                      <div className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-purple-200 bg-white text-purple-700'}`}>
                        💻 Code
                      </div>
                      <div className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-purple-200 bg-white text-purple-700'}`}>
                        🎓 Learn
                      </div>
                    </div>

                    {/* Sample Questions - Only show if enabled in customization */}
                    {customization.showQuestions && (
                      <div className="space-y-3 mb-8">
                        {['How does AI work?', 'Are black holes real?', 'How many Rs are in the word "strawberry"?', 'What is the meaning of life?'].map((question, index) => (
                          <button
                            key={index}
                            onClick={() => sendMessage(question)}
                            className={`block w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
                              isDark 
                                ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                                : 'hover:text-purple-800'
                            }`}
                            style={{ 
                              fontFamily: customization.fontFamily,
                              color: isDark ? undefined : customization.primaryColor + 'CC'
                            }}
                            onMouseEnter={(e) => {
                              if (!isDark) {
                                e.currentTarget.style.background = customization.gradientEnabled
                                  ? `linear-gradient(135deg, ${customization.primaryColor}20, ${customization.secondaryColor}10)`
                                  : customization.primaryColor + '20';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDark) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Chat Area - Separate draggable element */}
          {mobileLayout.mobileChatArea && messages.length > 0 && isMobile && (
            <div 
              className="overflow-hidden pointer-events-auto"
              style={{
                gridColumn: `${mobileLayout.mobileChatArea.x + 1} / ${mobileLayout.mobileChatArea.x + mobileLayout.mobileChatArea.width + 1}`,
                gridRow: `${mobileLayout.mobileChatArea.y + 1} / ${mobileLayout.mobileChatArea.y + mobileLayout.mobileChatArea.height + 1}`,
                zIndex: mobileLayout.mobileChatArea.zIndex
              }}
            >
              <ChatView
                isDark={isDark}
                messages={messages}
                onSendMessage={sendMessage}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                availableModels={filteredModels}
                hideInput={true}
                customization={customization}
                isLoggedIn={!!user}
                onLoginClick={() => setShowLoginModal(true)}
                error={chatError}
                setError={setChatError}
                onRegenerateResponse={() => handleRegenerateResponse()}
              />
            </div>
          )}

          {/* Mobile Input Box - Only shows input controls, NO title */}
          {mobileLayout.mobileInputBox && isMobile && (
            <div 
              className="pointer-events-auto"
              style={{
                gridColumn: `${mobileLayout.mobileInputBox.x + 1} / ${mobileLayout.mobileInputBox.x + mobileLayout.mobileInputBox.width + 1}`,
                gridRow: `${mobileLayout.mobileInputBox.y + 1} / ${mobileLayout.mobileInputBox.y + mobileLayout.mobileInputBox.height + 1}`,
                zIndex: mobileLayout.mobileInputBox.zIndex
              }}
            >
              <div className="h-full flex items-end p-4">
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
                    e.stopPropagation();
                    const input = e.currentTarget.querySelector('textarea') as HTMLTextAreaElement;
                    if (input?.value.trim()) {
                      sendMessage(input.value);
                      input.value = '';
                    }
                  }}>
                    {/* Message Input Container */}
                    <div className={`relative rounded-2xl border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-purple-200'
                    } shadow-sm pointer-events-auto`}>
                      <textarea
                        placeholder="Type your message here..."
                        className={`w-full px-6 py-4 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 pointer-events-auto ${
                          isDark 
                            ? 'bg-gray-700 text-white placeholder-gray-400' 
                            : 'bg-white text-gray-900 placeholder-gray-500'
                        }`}
                        style={{ 
                          fontFamily: customization.fontFamily,
                          touchAction: 'manipulation'
                        }}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.value.trim()) {
                            e.preventDefault();
                            sendMessage(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        onFocus={(e) => {
                          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                              className={`p-1 pointer-events-auto ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                              style={{ color: isDark ? undefined : customization.primaryColor }}
                              onTouchStart={(e) => e.stopPropagation()}
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
                          className="text-white p-2.5 rounded-xl transition-colors hover:opacity-90 pointer-events-auto"
                          style={{ 
                            background: customization.gradientEnabled 
                              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                              : customization.primaryColor 
                          }}
                          onTouchStart={(e) => e.stopPropagation()}
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
                <div 
                  className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-purple-50'} flex items-center justify-center px-2`}
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
                  className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-purple-50'} flex items-center justify-center`}
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
                <div 
                  className="h-full w-full flex items-center justify-center"
                  style={{
                    background: isDesignerMode 
                      ? (isDark ? '#1f2937' : '#f3f4f6') 
                      : (customization.gradientEnabled && !isDark 
                          ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                          : undefined)
                  }}
                >
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    style={{
                      background: isDesignerMode 
                        ? '#3b82f6' 
                        : undefined
                    }}
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
                <div 
                  className="h-full w-full flex items-center justify-center"
                  style={{
                    background: isDesignerMode 
                      ? (isDark ? '#1f2937' : '#f3f4f6') 
                      : (customization.gradientEnabled && !isDark 
                          ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                          : undefined)
                  }}
                >
                  <button
                    onClick={() => setShowSignupModal(true)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    style={{
                      background: isDesignerMode 
                        ? '#10b981' 
                        : undefined
                    }}
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
                <div 
                  className="h-full w-full flex items-center justify-center"
                  style={{
                    background: isDesignerMode 
                      ? (isDark ? '#1f2937' : '#f3f4f6') 
                      : (customization.gradientEnabled && !isDark 
                          ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}10)`
                          : undefined)
                  }}
                >
                  <button
                    onClick={toggleAccountMenu}
                    className={`p-2.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}
                    style={{
                      background: isDesignerMode 
                        ? '#f59e0b' 
                        : undefined
                    }}
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

export default App;