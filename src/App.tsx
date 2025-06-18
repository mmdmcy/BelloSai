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

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MainContent from './components/MainContent';
import ThemeToggle from './components/ThemeToggle';
import DesignerMode from './components/DesignerMode';
import MobileDesignerMode from './components/MobileDesignerMode';
import AccountMenu from './components/AccountMenu';
import GameSection from './components/GameSection';
import APIKeyManager from './components/APIKeyManager';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { sendChatMessage, DeepSeekModel, ChatMessage } from './lib/supabase-chat';
import { chatFeaturesService } from './lib/chat-features';
import { anonymousUsageService } from './lib/anonymous-usage';
import { layoutManager, ExtendedLayoutConfig, MobileLayoutConfig, defaultMobileLayout } from './lib/auth-integration'
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
  provider: 'DeepSeek' | 'Gemini';
  capabilities: string[]; // array van capability keys
  description?: string;
}

export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  text: { key: 'text', label: 'Tekst', icon: 'FileText' },
  image: { key: 'image', label: 'Afbeelding', icon: 'Image' },
  audio: { key: 'audio', label: 'Audio', icon: 'Mic' },
  video: { key: 'video', label: 'Video', icon: 'Video' },
  code: { key: 'code', label: 'Code', icon: 'Code' },
  function_calling: { key: 'function_calling', label: 'Functie-aanroep', icon: 'FunctionSquare' },
  caching: { key: 'caching', label: 'Caching', icon: 'Database' },
  structured_outputs: { key: 'structured_outputs', label: 'Structured Output', icon: 'ListChecks' },
  search: { key: 'search', label: 'Zoeken', icon: 'Globe' },
  tuning: { key: 'tuning', label: 'Tuning', icon: 'SlidersHorizontal' },
  reasoning: { key: 'reasoning', label: 'Redeneren', icon: 'Brain' },
};

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    name: 'Gemini 2.5 Pro',
    code: 'gemini-2.5-pro-preview-06-05',
    provider: 'Gemini',
    capabilities: ['text', 'audio', 'image', 'video', 'code', 'function_calling', 'caching', 'structured_outputs', 'reasoning'],
    description: 'State-of-the-art reasoning, grote context, code, STEM, datasets.'
  },
  {
    name: 'Gemini 2.5 Flash',
    code: 'models/gemini-2.5-flash-preview-05-20',
    provider: 'Gemini',
    capabilities: ['text', 'audio', 'image', 'video', 'code', 'function_calling', 'caching', 'structured_outputs', 'search'],
    description: 'Beste prijs-prestatie, snelle preview, brede multimodale input.'
  },
  {
    name: 'Gemini 2.0 Flash',
    code: 'models/gemini-2.0-flash',
    provider: 'Gemini',
    capabilities: ['text', 'audio', 'image', 'video', 'code', 'function_calling', 'caching', 'structured_outputs', 'search'],
    description: 'Snelle, grote context, tool use, live API.'
  },
  {
    name: 'DeepSeek V3',
    code: 'DeepSeek-V3',
    provider: 'DeepSeek',
    capabilities: ['text', 'code', 'reasoning'],
    description: 'DeepSeek chat model, sterke algemene AI.'
  },
  {
    name: 'DeepSeek R1',
    code: 'DeepSeek-R1',
    provider: 'DeepSeek',
    capabilities: ['text', 'code', 'reasoning'],
    description: 'DeepSeek reasoner, geoptimaliseerd voor redeneren.'
  },
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
    gradientColors: ['#7c3aed', '#a855f7'],
    selectedTheme: 'default'
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
  const sendMessage = async (content: string) => {
    setChatError(null); // Reset error bij nieuw bericht
    let aiMessageId: string | null = null;
    let currentConvoId: string | null = currentConversationId;
    let requestTimeoutId: NodeJS.Timeout | null = null;

    try {
      console.log('🚀 sendMessage called with:', content);
      console.log('🔍 Current isGenerating state:', isGenerating);
      
      if (isGenerating) {
        console.log('⚠️ Already generating, skipping request');
        return; // Prevent multiple simultaneous requests
      }

      if (!content || content.trim() === '') {
        console.log('⚠️ Empty message content, skipping request');
        return; // Don't send empty messages
      }

      // Check anonymous user limits if not logged in
      if (!user) {
        if (!anonymousUsageService.canSendMessage()) {
          const stats = anonymousUsageService.getUsageStats();
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: `Je hebt je dagelijkse limiet van ${stats.limit} berichten bereikt. Log in voor onbeperkt gebruik of probeer het morgen opnieuw. Je limiet wordt gereset om ${stats.resetTime}.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        
        // Increment usage for anonymous users
        anonymousUsageService.incrementMessageCount();
      }
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: content.trim(),
        timestamp: new Date()
      };

      console.log('📝 Adding user message:', userMessage);
      setMessages(prev => [...prev, userMessage]);
      setMessageCount(prev => prev + 1);
      
      // Create AI message placeholder for streaming
      console.log('🤖 Creating AI message placeholder...');
      aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        model: selectedModel // modelcode opslaan
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(true);
      console.log('🔄 Set isGenerating to true');

      // Set up request timeout (90 seconds)
      requestTimeoutId = setTimeout(() => {
        console.error('⏰ Request timeout after 90 seconds');
        setChatError('Het verzoek duurde te lang. Probeer het opnieuw of probeer een kortere vraag.');
        setIsGenerating(false);
        
        // Update AI message with timeout error
        if (aiMessageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: 'Het verzoek duurde te lang. Probeer het opnieuw of probeer een kortere vraag.' 
                }
              : msg
          ));
        }
      }, 90000);

      // Create or get conversation
      if (!currentConvoId && user) {
        console.log('🆕 Creating new conversation for user:', user.id);
        try {
          const newConversation = await chatFeaturesService.createConversation(user.id, content.trim(), selectedModel);
          currentConvoId = newConversation.id; // Extract only the ID
          setCurrentConversationId(currentConvoId);
          console.log('✅ New conversation created:', currentConvoId);
          
          // Add the new conversation to the conversations list immediately
          setConversations(prev => [newConversation, ...prev]);
          console.log('✅ New conversation added to list');
        } catch (error) {
          console.error('❌ Failed to create conversation:', error);
          // Continue without conversation - AI will still work, just won't be saved
          console.log('⚠️ Continuing without conversation - messages will not be saved');
        }
      }

      // Save user message to database if we have a conversation
      if (currentConvoId) {
        try {
          console.log('💾 Saving user message to database...');
          // Ensure we pass a string ID
          await chatFeaturesService.saveMessage(currentConvoId, 'user', content.trim());
          console.log('✅ User message saved to database');
        } catch (error) {
          console.error('❌ Failed to save user message:', error);
          // Continue without saving
        }
      }

      // Convert messages to ChatMessage format
      const chatMessages: ChatMessage[] = [...messages, userMessage].map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      console.log('🔄 About to call sendChatMessage...');
      console.log('📋 Chat messages count:', chatMessages.length);
      console.log('📋 Last message:', chatMessages[chatMessages.length - 1]);
      console.log('🤖 Selected model:', selectedModel);
      
      // Validation checks
      if (!chatMessages || chatMessages.length === 0) {
        throw new Error('No chat messages available for sending');
      }
      
      if (!selectedModel) {
        throw new Error('No model selected');
      }
      
      console.log('✅ Pre-flight checks passed, calling sendChatMessage...');

      // Send to DeepSeek with streaming
      console.log('📡 Calling sendChatMessage with parameters:');
      console.log('  - Messages count:', chatMessages.length);
      console.log('  - Model:', selectedModel);
      console.log('  - AI Message ID:', aiMessageId);
      console.log('  - Conversation ID:', currentConvoId);
      
      let fullResponse = '';

      try {
        console.log('🚀 Starting sendChatMessage call...');
        fullResponse = await sendChatMessage(
            chatMessages,
            selectedModel as DeepSeekModel,
            async (chunk: string) => {
              if (!chunk) return;
              
              console.log('📦 Received streaming chunk:', chunk.length, 'chars');
              
              // Update the AI message with streaming content (UI only, no database save yet)
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ));

              fullResponse += chunk;
            },
            currentConvoId || undefined
          );
        
        console.log('✅ sendChatMessage completed successfully');
        console.log('📝 Full response length:', fullResponse?.length || 0);

        // Clear timeout since request completed successfully
        if (requestTimeoutId) {
          clearTimeout(requestTimeoutId);
          requestTimeoutId = null;
        }

        // Save final message to database if we have a conversation
        if (currentConvoId && fullResponse) {
          try {
            console.log('💾 Saving final AI message to database...');
            await chatFeaturesService.saveMessage(currentConvoId, 'assistant', fullResponse, selectedModel);
            console.log('✅ Final AI message saved to database');
            
            // Generate and update conversation title if this is a new conversation
            if (messages.length <= 2) { // Only for new conversations (user + AI message)
              // Do this in the background to not block the UI
              const updateTitle = async () => {
                try {
                  console.log('📝 Generating conversation title...');
                  const conversationMessages = [
                    { role: 'user', content: content.trim() },
                    { role: 'assistant', content: fullResponse }
                  ];
                  const newTitle = await chatFeaturesService.generateConversationTitle(conversationMessages);
                  
                  // Update database in background
                  if (currentConvoId) {
                    chatFeaturesService.updateConversationTitle(currentConvoId, newTitle)
                      .catch(error => console.error('⚠️ Failed to update title in database:', error));
                  }
                  
                  // Update local state immediately
                  setConversationTitle(newTitle);
                  setConversations(prev => prev.map(conv => 
                    conv.id === currentConvoId ? { ...conv, title: newTitle } : conv
                  ));
                  console.log('✅ Conversation title updated:', newTitle);
                } catch (titleError) {
                  console.error('⚠️ Failed to generate conversation title:', titleError);
                }
              };
              
              // Don't await this - let it run in background
              updateTitle();
            }
          } catch (error) {
            console.error('❌ Failed to save final AI message:', error);
          }
        }

      } catch (error) {
        // Clear timeout since request failed
        if (requestTimeoutId) {
          clearTimeout(requestTimeoutId);
          requestTimeoutId = null;
        }

        console.error('❌ sendChatMessage failed:', error);
        
        // Handle specific error types
        let errorMessage = 'Er is een onbekende fout opgetreden.';
        
        if (error instanceof Error) {
          if (error.message.includes('timeout') || error.message.includes('took too long')) {
            errorMessage = 'Het verzoek duurde te lang. Probeer het opnieuw of probeer een kortere vraag.';
          } else if (error.message.includes('rate limit') || error.message.includes('429')) {
            errorMessage = 'Je hebt het maximum aantal verzoeken bereikt. Wacht even en probeer het opnieuw.';
          } else if (error.message.includes('authentication') || error.message.includes('401')) {
            errorMessage = 'Authenticatie fout. Probeer opnieuw in te loggen.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Netwerk fout. Controleer je internetverbinding en probeer het opnieuw.';
          } else {
            errorMessage = error.message;
          }
        }
        
        setChatError(errorMessage);
        
        // Update AI message with error
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: errorMessage
              }
            : msg
        ));
        
        throw error;
      }

      // Ensure we have content
      if (!fullResponse || fullResponse.trim() === '') {
        throw new Error('Empty response received from AI service');
      }
      
      // Update with final response
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: fullResponse, model: selectedModel }
          : msg
      ));

    } catch (error) {
      console.error('❌ Message sending failed:', error);
      
      // Clear timeout if still active
      if (requestTimeoutId) {
        clearTimeout(requestTimeoutId);
        requestTimeoutId = null;
      }
      
      // Only show error message if we haven't already
      if (aiMessageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: 'Er is een fout opgetreden bij het verwerken van je bericht. Probeer het opnieuw of neem contact op met support als het probleem aanhoudt.' 
              }
            : msg
        ));
      }
    } finally {
      setIsGenerating(false);
      
      // Ensure timeout is cleared
      if (requestTimeoutId) {
        clearTimeout(requestTimeoutId);
      }
    }
  };

  /**
   * Handle new chat creation
   */
  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setConversationTitle('Untitled Conversation');
    setIsGenerating(false); // Reset generating state
    
    // Clear all cache when starting new chat to ensure fresh data
    setConversationCache(new Map());
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
    if (!user) return;
    
    // Prevent multiple simultaneous loads of the same conversation
    if (isLoadingConversation) {
      console.log('⚠️ Already loading a conversation, ignoring request');
      return;
    }
    
    // If clicking the same conversation and it's already loaded, do nothing
    if (currentConversationId === conversationId && messages.length > 0) {
      console.log('✅ Conversation already loaded, no action needed');
      return;
    }
    
    // Reset generating state when switching conversations
    setIsGenerating(false);
    setIsLoadingConversation(true);
    
    // Find conversation title first
    const conversation = conversations.find(c => c.id === conversationId);
    
    setCurrentConversationId(conversationId);
    setConversationTitle(conversation?.title || 'Conversatie wordt geladen...');
    
    try {
      // Check cache first
      const cachedMessages = conversationCache.get(conversationId);
      if (cachedMessages) {
        console.log('✅ Using cached messages for:', conversationId);
        setMessages(cachedMessages);
        setConversationTitle(conversation?.title || 'Untitled Conversation');
        return;
      }

      // Clean up any duplicate messages first
      await chatFeaturesService.removeDuplicateMessages(conversationId);
      
      // Fetch fresh data from database
      console.log('🔄 Loading fresh messages from database for:', conversationId);
      const conversationMessages = await chatFeaturesService.getConversationMessages(conversationId);
      
      if (conversationMessages && conversationMessages.length > 0) {
        // Convert to Message format
        const messages: Message[] = conversationMessages.map((msg: any) => ({
          id: msg.id,
          type: (msg.role || msg.type) === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }));
        
        console.log('✅ Loaded', messages.length, 'messages from database');
        setMessages(messages);
        
        // Update cache with fresh data
        setConversationCache(prev => new Map(prev.set(conversationId, messages)));
      } else {
        console.log('⚠️ No messages found in database');
        setMessages([]);
        // Cache empty array too
        setConversationCache(prev => new Map(prev.set(conversationId, [])));
      }
      
      // Update title once loaded
      setConversationTitle(conversation?.title || 'Untitled Conversation');
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      // Show error but still allow user to use the conversation
      setMessages([]);
      setConversationTitle(conversation?.title || 'Conversatie (laden mislukt)');
    } finally {
      setIsLoadingConversation(false);
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
      alert('Er is een fout opgetreden bij het verwijderen van de conversatie.');
    }
  };

  /**
   * Regenerate the last AI response
   * Removes the last AI message and tries to generate a new response
   */
  const regenerateResponse = async () => {
    if (isGenerating || messages.length === 0) return;
    
    // Find the last AI message
    let lastAiMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'ai') {
        lastAiMessageIndex = i;
        break;
      }
    }
    
    if (lastAiMessageIndex === -1) return;
    
    // Find the last user message before the AI message
    let lastUserMessageIndex = -1;
    for (let i = lastAiMessageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove the last AI message
    setMessages(prev => prev.slice(0, lastAiMessageIndex));
    
    // Try to send the last user message again
    console.log('🔄 Regenerating response for:', lastUserMessage.content);
    await sendMessage(lastUserMessage.content);
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
    setCustomization(prev => ({ ...prev, ...newSettings }));
  };

  /**
   * Apply a theme to the customization settings
   */
  const applyTheme = (themeId: string) => {
    const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
    if (theme) {
      setCustomization(prev => ({
        ...prev,
        selectedTheme: themeId,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        fontFamily: theme.fontFamily,
        gradientEnabled: theme.gradientEnabled
      }));
    }
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
      className={`h-screen overflow-hidden ${isDark ? 'dark bg-gray-900' : 'bg-purple-50'}`}
      style={{ fontFamily: customization.fontFamily }}
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
                availableModels={availableModels}
                hideInput={true}
                customization={customization}
                isLoggedIn={!!user}
                onLoginClick={() => setShowLoginModal(true)}
                error={chatError}
                setError={setChatError}
                onRegenerateResponse={regenerateResponse}
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
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className={`text-xs px-2 py-1 rounded-md border pointer-events-auto ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-gray-300' 
                                : 'bg-white border-gray-300 text-gray-700'
                            }`}
                            style={{ fontFamily: customization.fontFamily }}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            {availableModels.map(model => (
                              <option key={model.code} value={model.code}>{model.name}</option>
                            ))}
                          </select>
                          {/* Search Button */}
                          <button 
                            type="button"
                            className={`p-1 pointer-events-auto ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                            style={{ color: isDark ? undefined : customization.primaryColor }}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                            </svg>
                          </button>
                          {/* Attachment Button */}
                          <button 
                            type="button"
                            className={`p-1 pointer-events-auto ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                            style={{ color: isDark ? undefined : customization.primaryColor }}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z"/>
                            </svg>
                          </button>
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
                  onNewChat={handleNewChat}
                  detachedMode={true} // New prop to indicate detached components
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onConversationSelect={handleConversationSelect}
                  onConversationDelete={handleConversationDelete}
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
                      {getUserInitial()}
                    </div>
                    <div className="text-xs">{getUserDisplayName()}</div>
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
                      customization={customization}
                      isLoggedIn={!!user}
                      onLoginClick={() => setShowLoginModal(true)}
                    />
                  ) : !isMobile && (
                    <ChatView 
                      isDark={isDark} 
                      messages={messages}
                      onSendMessage={sendMessage}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      availableModels={availableModels}
                      hideInput={true}
                      customization={customization}
                      isGenerating={isGenerating}
                      conversationId={currentConversationId || undefined}
                      conversationTitle={conversationTitle}
                      isLoggedIn={!!user}
                      onLoginClick={() => setShowLoginModal(true)}
                      error={chatError}
                      setError={setChatError}
                      onRegenerateResponse={regenerateResponse}
                    />
                  )}
                </div>
              )}

              {/* Input Box - Only shows input controls on desktop */}
              {elementKey === 'inputBox' && !isMobile && (
                <div className={`h-full w-full ${isDark ? 'bg-gray-900' : 'bg-purple-50'} p-4`}>
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
                        <div className={`relative rounded-2xl border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-purple-200'
                        } shadow-sm`}>
                          <textarea
                            placeholder="Type your message here..."
                            className={`w-full px-6 py-4 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                              isDark 
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
                              <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className={`text-xs px-2 py-1 rounded-md border ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-gray-300' 
                                    : 'bg-white border-gray-300 text-gray-700'
                                }`}
                                style={{ fontFamily: customization.fontFamily }}
                              >
                                {availableModels.map(model => (
                                  <option key={model.code} value={model.code}>{model.name}</option>
                                ))}
                              </select>
                              {/* Search Button */}
                              <button 
                                type="button"
                                className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                                style={{ color: isDark ? undefined : customization.primaryColor }}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                                </svg>
                              </button>
                              {/* Attachment Button */}
                              <button 
                                type="button"
                                className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                                style={{ color: isDark ? undefined : customization.primaryColor }}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z"/>
                                </svg>
                              </button>
                            </div>
                            
                            {/* Send Button */}
                            <button 
                              type="submit"
                              className="text-white p-2.5 rounded-xl transition-colors hover:opacity-90"
                              style={{ 
                                background: customization.gradientEnabled 
                                  ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                                  : customization.primaryColor 
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