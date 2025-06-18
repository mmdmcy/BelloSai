/**
 * ChatView Component
 * 
 * This component renders the chat interface when there are active conversations.
 * It displays the conversation history and provides input functionality for new messages.
 * 
 * Features:
 * - Message rendering with markdown support and smooth animations
 * - Syntax highlighting for code snippets
 * - Auto-scrolling to latest messages
 * - Copy and regenerate functionality for AI responses
 * - Responsive design with proper message alignment
 * - Auto-resizing textarea for input
 * - Model selection and additional controls
 * - Dynamic scaling based on container size
 * - Compact user message bubbles
 * - Smooth fade-in animations for streaming content
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ArrowUp, Copy, RotateCcw, RefreshCw, Share2, Image, Globe, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Message } from '../App';
import { CustomizationSettings, AVAILABLE_MODELS, ModelInfo } from '../App';
import ModelSelector from './ModelSelector';
import AttachmentUpload from './AttachmentUpload';
import ChatSharing from './ChatSharing';
import AnonymousUsageIndicator from './AnonymousUsageIndicator';

interface ChatViewProps {
  isDark: boolean;
  messages: Message[];
  onSendMessage: (message: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  hideInput?: boolean;
  inputOnly?: boolean;
  customization: CustomizationSettings;
  onRegenerateResponse?: () => void;
  isGenerating?: boolean;
  conversationId?: string;
  conversationTitle?: string;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  error?: string | null;
  setError?: (err: string | null) => void;
}

// Custom component for animated text content with smooth fade-in
const AnimatedText: React.FC<{ 
  content: string; 
  isStreaming?: boolean; 
  isDark: boolean; 
  customization: CustomizationSettings;
}> = React.memo(({ content, isStreaming = false, isDark, customization }) => {
  const [displayContent, setDisplayContent] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [wasStreaming, setWasStreaming] = useState(false);
  
  useEffect(() => {
    // When streaming stops, show the content with smooth fade-in
    if (wasStreaming && !isStreaming) {
      setDisplayContent(content);
      setIsVisible(true);
      setWasStreaming(false);
      return;
    }
    
    // When streaming starts or content changes during streaming
    if (isStreaming) {
      setWasStreaming(true);
      setDisplayContent(content);
      setIsVisible(true); // Show immediately during streaming
    } else if (!wasStreaming) {
      // Initial load - show with fade-in
      setDisplayContent(content);
      setTimeout(() => setIsVisible(true), 50); // Small delay for smooth transition
    }
  }, [content, isStreaming, wasStreaming]);

  const textStyle = {
    fontFamily: customization.fontFamily,
    transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
  };

  return (
    <div 
      className={`prose ${isDark ? 'prose-invert' : 'prose-gray'} max-w-none mb-4 transition-all duration-300 ease-out streaming-container`}
      style={textStyle}
    >
      <div className="relative">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Custom styling for code blocks with fade animation
            pre: ({ children, ...props }) => (
              <div className={`rounded-xl overflow-hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } border ${isDark ? 'border-gray-700' : 'border-purple-200'} transform transition-all duration-500 ease-in-out hover:scale-[1.02] shadow-lg`}>
                <div 
                  className="flex items-center justify-between px-4 py-3 border-b text-white"
                  style={{ 
                    backgroundColor: customization.primaryColor,
                    borderBottomColor: isDark ? '#374151' : customization.primaryColor + '40'
                  }}
                >
                  <span 
                    className="text-sm font-medium"
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    Code
                  </span>
                  <button 
                    className="p-1 rounded hover:bg-black/10 text-white transition-all duration-200 hover:scale-110"
                    onClick={() => {
                      const code = (children as any)?.props?.children?.[0]?.props?.children;
                      if (code && typeof code === 'string') {
                        navigator.clipboard.writeText(code);
                      }
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <pre 
                    {...props}
                    className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} overflow-x-auto m-0`}
                    style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                  >
                    {children}
                  </pre>
                </div>
              </div>
            ),
            // Smooth paragraphs with fade effect
            p: ({ children, ...props }) => (
              <p 
                className={`mb-4 leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'} transition-all duration-300 ease-out`}
                style={{ 
                  fontFamily: customization.fontFamily,
                }}
                {...props}
              >
                {children}
              </p>
            ),
          }}
        >
          {displayContent}
        </ReactMarkdown>
        
        {/* Smooth streaming indicator */}
        {isStreaming && (
          <div className="streaming-indicator animate-pulse ml-1 inline-block">
            <div className="w-2 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-80"></div>
          </div>
        )}
      </div>
    </div>
  );
});

export default function ChatView({ 
  isDark, 
  messages, 
  onSendMessage, 
  selectedModel, 
  onModelChange, 
  availableModels,
  hideInput = false,
  inputOnly = false,
  customization,
  onRegenerateResponse,
  isGenerating = false,
  conversationId,
  conversationTitle = 'Untitled Conversation',
  isLoggedIn = false,
  onLoginClick,
  error,
  setError
}: ChatViewProps) {
  // Input state management
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Scroll state management
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  
  // Feature states
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false);
  const [showChatSharing, setShowChatSharing] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  /**
   * Monitor container size changes for responsive scaling with throttling
   */
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const throttledUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateContainerWidth, 100); // Throttle to improve performance
    };

    throttledUpdate();
    window.addEventListener('resize', throttledUpdate);
    
    // Use ResizeObserver for more accurate container size tracking
    const resizeObserver = new ResizeObserver(throttledUpdate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', throttledUpdate);
      resizeObserver.disconnect();
    };
  }, [updateContainerWidth]);

  /**
   * Memoized responsive calculations for better performance
   */
  const responsiveStyles = useMemo(() => ({
    aiMessageMaxWidth: (() => {
      if (containerWidth < 600) return '90%';
      if (containerWidth < 800) return '85%';
      if (containerWidth < 1200) return '80%';
      if (containerWidth < 1600) return '75%';
      return '70%';
    })(),
    userMessageMaxWidth: (() => {
      if (containerWidth < 600) return '75%';
      if (containerWidth < 800) return '65%';
      if (containerWidth < 1200) return '55%';
      return '45%';
    })(),
    padding: (() => {
      if (containerWidth < 600) return 'px-4';
      if (containerWidth < 1200) return 'px-8';
      return 'px-12';
    })()
  }), [containerWidth]);

  /**
   * Optimized scroll handling with throttling
   */
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Show button if user has scrolled up more than 100px from bottom
    const shouldShowButton = distanceFromBottom > 100 && messages.length > 3;
    setShowScrollButton(shouldShowButton);
    
    // Track if user is near bottom for auto-scroll behavior
    setIsNearBottom(distanceFromBottom < 50);
  }, [messages.length]);

  /**
   * Optimized scroll to bottom with smooth animation
   */
  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [isNearBottom]);

  /**
   * Auto-scroll when new messages arrive, but only if user is near bottom
   */
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      // Small delay to ensure content is rendered
      const timeoutId = setTimeout(() => scrollToBottom(), 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, scrollToBottom, isNearBottom]);

  /**
   * Handle attachment upload
   */
  const handleAttachmentUploaded = useCallback((attachment: any) => {
    setAttachments(prev => [...prev, attachment]);
    console.log('Attachment uploaded:', attachment);
  }, []);

  /**
   * Handle attachment upload error
   */
  const handleAttachmentError = useCallback((error: string) => {
    console.error('Attachment error:', error);
    // You could show a toast notification here
  }, []);

  /**
   * Handle web search
   */
  const handleWebSearch = useCallback((query: string) => {
    console.log('Web search:', query);
    // Implement web search functionality
  }, []);

  /**
   * Handle image generation
   */
  const handleImageGeneration = useCallback((prompt: string) => {
    console.log('Image generation:', prompt);
    // Implement image generation functionality
  }, []);

  /**
   * Optimized form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [inputValue, isGenerating, onSendMessage]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  /**
   * Auto-resize textarea with performance optimization
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
    textarea.style.height = newHeight + 'px';
  }, []);

  /**
   * Optimized message rendering with memoization
   */
  const renderMessage = useCallback((message: Message, index: number) => {
    // Check if this is the last AI message and if AI is currently generating
    const isLastAiMessage = message.type === 'ai' && index === messages.length - 1;
    const shouldShowLoading = isGenerating && isLastAiMessage;
    
    if (message.type === 'user') {
      // User message - right-aligned with custom color and compact sizing
      return (
        <div 
          key={message.id} 
          className="flex justify-end mb-6 transform transition-all duration-300 ease-in-out hover:scale-[1.02]"
        >
          <div 
            className="px-4 py-2.5 rounded-2xl text-white break-words shadow-lg"
            style={{ 
              backgroundColor: customization.primaryColor,
              fontFamily: customization.fontFamily,
              maxWidth: responsiveStyles.userMessageMaxWidth,
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {message.content}
          </div>
        </div>
      );
    } else {
      // AI message - left-aligned with markdown support and responsive sizing
      return (
        <div 
          key={message.id} 
          className="flex justify-start mb-6 transform transition-all duration-500 ease-in-out animate-fade-in"
        >
          <div className="w-full" style={{ maxWidth: responsiveStyles.aiMessageMaxWidth }}>
            {/* Animated Markdown Content */}
            <AnimatedText 
              content={message.content}
              isStreaming={shouldShowLoading}
              isDark={isDark}
              customization={customization}
            />

            {/* Action buttons with smooth animations */}
            <div className="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button 
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                onClick={() => navigator.clipboard.writeText(message.content)}
                title="Kopieer bericht"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              {onRegenerateResponse && index === messages.length - 1 && (
                <button 
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  onClick={onRegenerateResponse}
                  disabled={isGenerating}
                  title="Regenereer antwoord"
                >
                  <RotateCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              )}
              
              <button 
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                onClick={() => setShowChatSharing(true)}
                title="Deel bericht"
              >
                <Share2 className="w-4 h-4" />
              </button>
              
              {message.model && (
                <span 
                  className={`text-xs px-2 py-1 rounded-full ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  {message.model}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }
  }, [
    messages.length, 
    isGenerating, 
    customization, 
    responsiveStyles, 
    isDark, 
    onRegenerateResponse
  ]);

  // Input-only mode - renders just the message input interface with responsive sizing
  if (inputOnly) {
    return (
      <div className="h-full flex items-end" ref={containerRef}>
        <div className="w-full">
          <form onSubmit={handleSubmit}>
            {/* Message Input */}
            <div className={`relative rounded-2xl border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-purple-200'
            } shadow-sm`}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className={`w-full px-6 py-4 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                  isDark 
                    ? 'bg-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
                style={{ fontFamily: customization.fontFamily }}
                rows={1}
              />
              
              {/* Bottom Controls */}
              <div className="flex items-center justify-between px-6 pb-4">
                <div className="flex items-center gap-4">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    availableModels={availableModels}
                    isDark={isDark}
                    customization={customization}
                  />

                  {conversationId && (
                    <button 
                      type="button"
                      onClick={() => setShowChatSharing(true)}
                      className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                      style={{ color: isDark ? undefined : customization.primaryColor }}
                      title="Gesprek delen"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="text-white p-2.5 rounded-xl transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: customization.primaryColor }}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Full chat view layout with responsive scaling
  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 max-w-xl mx-auto">
          <span className="font-semibold">Fout:</span> {error}
        </div>
      )}
      {/* Chat Messages Area - Responsive padding */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto py-6 ${responsiveStyles.padding}`}
        onScroll={handleScroll}
      >
        <div className="w-full mx-auto">
          {messages.map((message, index) => renderMessage(message, index))}
          <div ref={messagesEndRef} />
          
          {/* Scroll to bottom indicator - only show when user has scrolled up */}
          {showScrollButton && (
            <div className="flex justify-center py-4">
              <button 
                onClick={() => scrollToBottom(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'text-white hover:opacity-90'
                }`}
                style={{ 
                  fontFamily: customization.fontFamily,
                  backgroundColor: isDark ? undefined : customization.primaryColor + '20',
                  color: isDark ? undefined : customization.primaryColor
                }}
              >
                Scroll to bottom
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Input Footer - Responsive sizing */}
      {!hideInput && (
        <div className={`pb-6 ${responsiveStyles.padding}`}>
          <div className="w-full mx-auto" style={{ maxWidth: responsiveStyles.aiMessageMaxWidth }}>
            {/* Anonymous Usage Indicator */}
            {!isLoggedIn && onLoginClick && (
              <AnonymousUsageIndicator onLoginClick={onLoginClick} />
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Message Input */}
              <div className={`relative rounded-2xl border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-purple-200'
              } shadow-sm`}>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  className={`w-full px-6 py-4 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                    isDark 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  style={{ fontFamily: customization.fontFamily }}
                  rows={1}
                />
                
                {/* Bottom Controls */}
                <div className="flex items-center justify-between px-6 pb-4">
                  <div className="flex items-center gap-4">
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={onModelChange}
                      availableModels={availableModels}
                      isDark={isDark}
                      customization={customization}
                    />

                  </div>
                  
                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="text-white p-2.5 rounded-xl transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: customization.primaryColor }}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Upload Modal */}
      {showAttachmentUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Bestand Uploaden
                </h3>
                <button
                  onClick={() => setShowAttachmentUpload(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AttachmentUpload
                onAttachmentUploaded={handleAttachmentUploaded}
                onError={handleAttachmentError}
                isDark={isDark}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      )}

      {/* Web Search Modal */}
      {showWebSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Web Zoeken
                </h3>
                <button
                  onClick={() => setShowWebSearch(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get('query') as string;
                if (query.trim()) {
                  handleWebSearch(query.trim());
                }
              }}>
                <input
                  name="query"
                  type="text"
                  placeholder="Zoek op het web..."
                  className={`w-full p-3 rounded-lg border mb-4 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Zoeken
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Generation Modal */}
      {showImageGeneration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Afbeelding Genereren
                </h3>
                <button
                  onClick={() => setShowImageGeneration(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const prompt = formData.get('prompt') as string;
                if (prompt.trim()) {
                  handleImageGeneration(prompt.trim());
                }
              }}>
                <textarea
                  name="prompt"
                  placeholder="Beschrijf de afbeelding die je wilt genereren..."
                  rows={4}
                  className={`w-full p-3 rounded-lg border mb-4 resize-none ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Genereren
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Chat Sharing Modal */}
      {conversationId && (
        <ChatSharing
          conversationId={conversationId}
          conversationTitle={conversationTitle}
          isDark={isDark}
          isOpen={showChatSharing}
          onClose={() => setShowChatSharing(false)}
        />
      )}
    </div>
  );
}
