/**
 * ChatView Component
 * 
 * This component renders the chat interface when there are active conversations.
 * It displays the conversation history and provides input functionality for new messages.
 * 
 * Features:
 * - Message rendering with markdown support
 * - Syntax highlighting for code snippets
 * - Auto-scrolling to latest messages
 * - Copy and regenerate functionality for AI responses
 * - Responsive design with proper message alignment
 * - Auto-resizing textarea for input
 * - Model selection and additional controls
 * - Dynamic scaling based on container size
 * - Compact user message bubbles
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Paperclip, ArrowUp, Copy, RotateCcw, RefreshCw, Share2, Image, Globe, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Message } from '../App';
import { CustomizationSettings, AVAILABLE_MODELS } from '../App';
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
  availableModels: string[];
  hideInput?: boolean;
  inputOnly?: boolean;
  customization: CustomizationSettings;
  onRegenerateResponse?: () => void;
  isGenerating?: boolean;
  conversationId?: string;
  conversationTitle?: string;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
}

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
  onLoginClick
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
   * Monitor container size changes for responsive scaling
   */
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    // Use ResizeObserver for more accurate container size tracking
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateContainerWidth);
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Calculate responsive max width for AI messages based on container size
   * Scales from 400px (small) to 1000px (large) based on container width
   */
  const getResponsiveMaxWidth = () => {
    if (containerWidth < 600) return '90%';
    if (containerWidth < 800) return '85%';
    if (containerWidth < 1200) return '80%';
    if (containerWidth < 1600) return '75%';
    return '70%'; // For very large containers
  };

  /**
   * Calculate responsive max width for user messages (much smaller)
   * User messages should be more compact and not take up too much space
   */
  const getUserMessageMaxWidth = () => {
    if (containerWidth < 600) return '75%';
    if (containerWidth < 800) return '65%';
    if (containerWidth < 1200) return '55%';
    return '45%'; // Much smaller for larger containers
  };

  /**
   * Calculate responsive padding based on container size
   */
  const getResponsivePadding = () => {
    if (containerWidth < 600) return 'px-4';
    if (containerWidth < 1200) return 'px-8';
    return 'px-12';
  };

  /**
   * Handle scroll events to show/hide scroll to bottom button
   */
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Show button if user has scrolled up more than 100px from bottom
    const shouldShowButton = distanceFromBottom > 100 && messages.length > 3;
    setShowScrollButton(shouldShowButton);
    
    // Track if user is near bottom for auto-scroll behavior
    setIsNearBottom(distanceFromBottom < 50);
  };

  /**
   * Auto-scroll to bottom when new messages arrive (only if user is near bottom)
   */
  const scrollToBottom = (force = false) => {
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Auto-scroll when new messages arrive, but only if user is near bottom
   */
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  /**
   * Handle attachment upload
   */
  const handleAttachmentUploaded = (attachment: any) => {
    setAttachments(prev => [...prev, attachment]);
    console.log('Attachment uploaded:', attachment);
  };

  /**
   * Handle attachment upload error
   */
  const handleAttachmentError = (error: string) => {
    console.error('Attachment error:', error);
    // You could show a toast notification here
  };

  /**
   * Handle web search
   */
  const handleWebSearch = (query: string) => {
    onSendMessage(`🌐 Zoek op het web: ${query}`);
    setShowWebSearch(false);
  };

  /**
   * Handle image generation
   */
  const handleImageGeneration = (prompt: string) => {
    onSendMessage(`🎨 Genereer afbeelding: ${prompt}`);
    setShowImageGeneration(false);
  };

  /**
   * Handle form submission for new messages
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  /**
   * Handle keyboard shortcuts in textarea
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Handle input changes and auto-resize textarea
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea based on content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  /**
   * Render individual message with proper scaling and responsive design
   * Handles both user and AI messages with different layouts
   */
  const renderMessage = (message: Message, index: number) => {
    const aiMessageMaxWidth = getResponsiveMaxWidth();
    const userMessageMaxWidth = getUserMessageMaxWidth();
    
    // Check if this is the last AI message and if AI is currently generating
    const isLastAiMessage = message.type === 'ai' && index === messages.length - 1;
    const shouldShowLoading = isGenerating && isLastAiMessage;
    
    if (message.type === 'user') {
      // User message - right-aligned with custom color and compact sizing
      return (
        <div key={message.id} className="flex justify-end mb-6">
          <div 
            className="px-4 py-2.5 rounded-2xl text-white break-words"
            style={{ 
              backgroundColor: customization.primaryColor,
              fontFamily: customization.fontFamily,
              maxWidth: userMessageMaxWidth,
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
        <div key={message.id} className="flex justify-start mb-6">
          <div className="w-full" style={{ maxWidth: aiMessageMaxWidth }}>
            {/* Markdown Content */}
            <div 
              className={`prose ${isDark ? 'prose-invert' : 'prose-gray'} max-w-none mb-4`}
              style={{ fontFamily: customization.fontFamily }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // Custom styling for code blocks
                  pre: ({ children, ...props }) => (
                    <div className={`rounded-xl overflow-hidden ${
                      isDark ? 'bg-gray-900' : 'bg-white'
                    } border ${isDark ? 'border-gray-700' : 'border-purple-200'}`}>
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
                          className="p-1 rounded hover:bg-black/10 text-white"
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
                          className={`${containerWidth < 600 ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-200' : 'text-gray-800'} overflow-x-auto m-0`}
                          style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                        >
                          {children}
                        </pre>
                      </div>
                    </div>
                  ),
                  // Custom styling for inline code
                  code: ({ children, className, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code 
                          className={`px-1.5 py-0.5 rounded text-sm ${
                            isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                          }`}
                          style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  // Custom styling for headings
                  h1: ({ children, ...props }) => (
                    <h1 
                      className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                      style={{ 
                        fontFamily: customization.fontFamily,
                        color: isDark ? undefined : customization.primaryColor
                      }}
                      {...props}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 
                      className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                      style={{ 
                        fontFamily: customization.fontFamily,
                        color: isDark ? undefined : customization.primaryColor
                      }}
                      {...props}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 
                      className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                      style={{ 
                        fontFamily: customization.fontFamily,
                        color: isDark ? undefined : customization.primaryColor
                      }}
                      {...props}
                    >
                      {children}
                    </h3>
                  ),
                  // Custom styling for paragraphs
                  p: ({ children, ...props }) => (
                    <p 
                      className={`mb-4 leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                      style={{ fontFamily: customization.fontFamily }}
                      {...props}
                    >
                      {children}
                    </p>
                  ),
                  // Custom styling for lists
                  ul: ({ children, ...props }) => (
                    <ul 
                      className={`mb-4 pl-6 space-y-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                      style={{ fontFamily: customization.fontFamily }}
                      {...props}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol 
                      className={`mb-4 pl-6 space-y-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                      style={{ fontFamily: customization.fontFamily }}
                      {...props}
                    >
                      {children}
                    </ol>
                  ),
                  // Custom styling for blockquotes
                  blockquote: ({ children, ...props }) => (
                    <blockquote 
                      className={`border-l-4 pl-4 py-2 mb-4 italic ${
                        isDark ? 'border-gray-600 text-gray-300' : 'text-gray-600'
                      }`}
                      style={{ 
                        borderLeftColor: isDark ? undefined : customization.primaryColor + '60',
                        fontFamily: customization.fontFamily 
                      }}
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                  // Custom styling for tables
                  table: ({ children, ...props }) => (
                    <div className="overflow-x-auto mb-4">
                      <table 
                        className={`min-w-full border-collapse ${
                          isDark ? 'border-gray-700' : 'border-gray-200'
                        }`}
                        {...props}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th 
                      className={`border px-4 py-2 text-left font-semibold ${
                        isDark 
                          ? 'border-gray-700 bg-gray-800 text-white' 
                          : 'border-gray-200 bg-gray-50 text-gray-900'
                      }`}
                      style={{ fontFamily: customization.fontFamily }}
                      {...props}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td 
                      className={`border px-4 py-2 ${
                        isDark 
                          ? 'border-gray-700 text-gray-200' 
                          : 'border-gray-200 text-gray-700'
                      }`}
                      style={{ fontFamily: customization.fontFamily }}
                      {...props}
                    >
                      {children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            
            {/* Response Actions */}
            <div className="flex items-center gap-4">
              <button 
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:text-purple-800'
                }`}
                style={{ color: isDark ? undefined : customization.primaryColor + 'AA' }}
                onClick={() => navigator.clipboard.writeText(message.content)}
                title="Copy message"
                onMouseEnter={(e) => {
                  if (!isDark) {
                    e.currentTarget.style.backgroundColor = customization.primaryColor + '20';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDark) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:text-purple-800'
                } ${shouldShowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ color: isDark ? undefined : customization.primaryColor + 'AA' }}
                onClick={onRegenerateResponse}
                disabled={shouldShowLoading || !onRegenerateResponse}
                title="Regenerate response with current model"
                onMouseEnter={(e) => {
                  if (!isDark) {
                    e.currentTarget.style.backgroundColor = customization.primaryColor + '20';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDark) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <RefreshCw className={`w-4 h-4 ${shouldShowLoading ? 'animate-spin' : ''}`} />
              </button>
              {message.model && (
                <span 
                  className={`text-sm ${isDark ? 'text-purple-400' : ''}`}
                  style={{ 
                    fontFamily: customization.fontFamily,
                    color: isDark ? undefined : customization.primaryColor 
                  }}
                >
                  {AVAILABLE_MODELS.find(m => m.code === message.model)?.name || message.model}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

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
                  <button 
                    type="button"
                    onClick={() => setShowWebSearch(!showWebSearch)}
                    className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                    style={{ color: isDark ? undefined : customization.primaryColor }}
                    title="Web zoeken"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAttachmentUpload(!showAttachmentUpload)}
                    className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                    style={{ color: isDark ? undefined : customization.primaryColor }}
                    title="Bestand uploaden"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowImageGeneration(!showImageGeneration)}
                    className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                    style={{ color: isDark ? undefined : customization.primaryColor }}
                    title="Afbeelding genereren"
                  >
                    <Image className="w-4 h-4" />
                  </button>
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
    <div 
      ref={containerRef}
      className={`flex-1 h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}
    >
      {/* Chat Messages Area - Responsive padding */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto py-6 ${getResponsivePadding()}`}
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
        <div className={`pb-6 ${getResponsivePadding()}`}>
          <div className="w-full mx-auto" style={{ maxWidth: getResponsiveMaxWidth() }}>
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
                    <button 
                      type="button"
                      className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                      style={{ color: isDark ? undefined : customization.primaryColor }}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      className={`p-1 ${isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'}`}
                      style={{ color: isDark ? undefined : customization.primaryColor }}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
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