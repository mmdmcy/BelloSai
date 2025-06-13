/**
 * ChatView Component
 * 
 * This component renders the chat interface when there are active conversations.
 * It displays the conversation history and provides input functionality for new messages.
 * 
 * Features:
 * - Message rendering with support for code blocks
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
import { ChevronDown, Search, Paperclip, ArrowUp, Copy, RotateCcw, RefreshCw } from 'lucide-react';
import { Message } from '../App';
import { CustomizationSettings } from '../App';
import ModelSelector from './ModelSelector';

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
  isGenerating = false
}: ChatViewProps) {
  // Input state management
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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
   * Auto-scroll to bottom when new messages arrive
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  const renderMessage = (message: Message) => {
    const aiMessageMaxWidth = getResponsiveMaxWidth();
    const userMessageMaxWidth = getUserMessageMaxWidth();
    
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
      // AI message - left-aligned with code block support and responsive sizing
      const hasCode = message.content.includes('```');
      
      if (hasCode) {
        // Parse code blocks from message content
        const parts = message.content.split('```');
        const beforeCode = parts[0];
        const codeContent = parts[1];
        const afterCode = parts[2] || '';
        
        // Extract language from code block
        const codeLines = codeContent.split('\n');
        const language = codeLines[0] || 'python';
        const code = codeLines.slice(1).join('\n');

        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div className="w-full" style={{ maxWidth: aiMessageMaxWidth }}>
              {/* Text before code block */}
              {beforeCode && (
                <p 
                  className={`mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  {beforeCode.trim()}
                </p>
              )}
              
              {/* Code Block Container - Scales with container */}
              <div className={`rounded-xl overflow-hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } border ${isDark ? 'border-gray-700' : 'border-purple-200'}`}>
                {/* Code Header with Language and Copy Button */}
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
                    {language}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-black/10 text-white">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Code Content - Responsive text size */}
                <div className="p-4">
                  <pre 
                    className={`${containerWidth < 600 ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-200' : 'text-gray-800'} overflow-x-auto`}
                    style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                  >
                    <code>{code}</code>
                  </pre>
                </div>
              </div>

              {/* Text after code block */}
              {afterCode && (
                <p 
                  className={`mt-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  {afterCode.trim()}
                </p>
              )}

              {/* Response Actions */}
              <div className="flex items-center gap-4 mt-4">
                <button className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:text-purple-800'
                }`}
                style={{ color: isDark ? undefined : customization.primaryColor + 'AA' }}
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
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ color: isDark ? undefined : customization.primaryColor + 'AA' }}
                  onClick={onRegenerateResponse}
                  disabled={isGenerating || !onRegenerateResponse}
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
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <span 
                  className={`text-sm ${isDark ? 'text-purple-400' : ''}`}
                  style={{ 
                    fontFamily: customization.fontFamily,
                    color: isDark ? undefined : customization.primaryColor 
                  }}
                >
                  {selectedModel}
                </span>
              </div>
            </div>
          </div>
        );
      } else {
        // Regular text message without code - Responsive sizing
        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div style={{ maxWidth: aiMessageMaxWidth }}>
              <p 
                className={`mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                style={{ fontFamily: customization.fontFamily }}
              >
                {message.content}
              </p>
              
              {/* Response Actions */}
              <div className="flex items-center gap-4">
                <button className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:text-purple-800'
                }`}
                style={{ color: isDark ? undefined : customization.primaryColor + 'AA' }}
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
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ color: isDark ? undefined : customization.primaryColor + 'AA' }}
                  onClick={onRegenerateResponse}
                  disabled={isGenerating || !onRegenerateResponse}
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
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <span 
                  className={`text-sm ${isDark ? 'text-purple-400' : ''}`}
                  style={{ 
                    fontFamily: customization.fontFamily,
                    color: isDark ? undefined : customization.primaryColor 
                  }}
                >
                  {selectedModel}
                </span>
              </div>
            </div>
          </div>
        );
      }
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
    );
  }

  // Full chat view layout with responsive scaling
  return (
    <div 
      ref={containerRef}
      className={`flex-1 h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}
    >
      {/* Chat Messages Area - Responsive padding */}
      <div className={`flex-1 overflow-y-auto py-6 ${getResponsivePadding()}`}>
        <div className="w-full mx-auto">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
          
          {/* Scroll to bottom indicator - only show for longer conversations */}
          {messages.length > 3 && (
            <div className="flex justify-center py-4">
              <button 
                onClick={scrollToBottom}
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
    </div>
  );
}