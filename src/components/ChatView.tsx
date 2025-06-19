/**
 * ChatView Component
 * 
 * Modern chat interface with clean design, loading indicators, and reasoning display
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ArrowUp, Copy, RotateCcw, Share2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Message } from '../App';
import { CustomizationSettings, ModelInfo } from '../App';
import ModelSelector from './ModelSelector';
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

// Modern markdown component without complex styling
const MarkdownContent: React.FC<{ 
  content: string; 
  isDark: boolean; 
  customization: CustomizationSettings;
}> = React.memo(({ content, isDark, customization }) => {
  return (
    <div className={`prose ${isDark ? 'prose-invert' : 'prose-gray'} max-w-none`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          p: ({ children, ...props }) => (
            <p 
              className={`mb-4 leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
              style={{ fontFamily: customization.fontFamily }}
              {...props}
            >
              {children}
            </p>
          ),
          h1: ({ children, ...props }) => (
            <h1 
              className={`mb-4 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ fontFamily: customization.fontFamily }}
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 
              className={`mb-3 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ fontFamily: customization.fontFamily }}
              {...props}
            >
              {children}
            </h2>
          ),
          ul: ({ children, ...props }) => (
            <ul className="mb-4 space-y-1 pl-4" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-4 space-y-1 pl-4" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li 
              className={`leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
              style={{ fontFamily: customization.fontFamily }}
              {...props}
            >
              {children}
            </li>
          ),
          pre: ({ children, ...props }) => (
            <div className={`rounded-lg overflow-hidden mb-4 ${
              isDark ? 'bg-gray-900' : 'bg-gray-50'
            } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
                <span className="text-sm font-medium">Code</span>
                <button 
                  className="p-1 rounded hover:bg-gray-700 transition-colors"
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
          code: ({ children, ...props }) => (
            <code 
              className={`px-1.5 py-0.5 rounded text-sm ${
                isDark 
                  ? 'bg-gray-700 text-purple-300' 
                  : 'bg-purple-50 text-purple-700'
              }`}
              style={{ fontFamily: 'Monaco, Consolas, monospace' }}
              {...props}
            >
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
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
  const [inputValue, setInputValue] = useState('');
  const [showChatSharing, setShowChatSharing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if current model supports reasoning
  const isReasoningModel = selectedModel === 'DeepSeek-R1' || selectedModel === 'gemini-2.5-pro-preview-06-05';

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isGenerating) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [inputValue, isGenerating, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMessage = useCallback((message: Message, index: number) => {
    const isLastAiMessage = message.type === 'ai' && index === messages.length - 1;
    
    if (message.type === 'user') {
      return (
        <div key={message.id} className="flex justify-end mb-6">
          <div 
            className="max-w-[80%] px-4 py-3 rounded-2xl text-white break-words"
            style={{ 
              backgroundColor: customization.primaryColor,
              fontFamily: customization.fontFamily
            }}
          >
            {message.content}
          </div>
        </div>
      );
    } else {
      return (
        <div key={message.id} className="flex justify-start mb-6">
          <div className="max-w-[85%] w-full">
            {/* Message content */}
            <div className={`rounded-2xl p-4 ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <MarkdownContent 
                content={message.content}
                isDark={isDark}
                customization={customization}
              />
            </div>
            
            {/* Message actions */}
            <div className="flex items-center justify-between mt-3 px-2">
              <div className="flex items-center space-x-2">
                {message.model && (
                  <span 
                    className={`text-xs px-2 py-1 rounded-full ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {message.model}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <button 
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  title="Kopieer bericht"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                {onRegenerateResponse && isLastAiMessage && (
                  <button 
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    onClick={onRegenerateResponse}
                    disabled={isGenerating}
                    title="Regenereer antwoord"
                  >
                    <RotateCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                )}
                
                {conversationId && (
                  <button 
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    onClick={() => setShowChatSharing(true)}
                    title="Deel bericht"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }, [customization, isDark, isGenerating, onRegenerateResponse, conversationId]);

  // Input-only mode
  if (inputOnly) {
    return (
      <div className="h-full flex items-end">
        <div className="w-full">
          {!isLoggedIn && onLoginClick && (
            <AnonymousUsageIndicator onLoginClick={onLoginClick} />
          )}
          
          <form onSubmit={handleSubmit}>
            <div className={`relative rounded-2xl border ${
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            } shadow-sm`}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Typ je bericht hier..."
                className={`w-full px-4 py-3 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                  isDark 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
                style={{ fontFamily: customization.fontFamily }}
                rows={1}
              />
              
              <div className="flex items-center justify-between px-4 pb-3">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  availableModels={availableModels}
                  isDark={isDark}
                  customization={customization}
                />
                
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isGenerating}
                  className="text-white p-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
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

  // Full chat view
  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 mx-4">
          <span className="font-semibold">Fout:</span> {error}
        </div>
      )}
      
      {/* Chat Messages Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* Loading indicator or reasoning display */}
          {isGenerating && (
            <div className="flex justify-start mb-6">
              <div className="max-w-[85%] w-full">
                <div className={`rounded-2xl p-4 ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  {isReasoningModel ? (
                    <div className="flex items-center space-x-3">
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="font-medium">Reasoning</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        AI aan het typen...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {!hideInput && (
        <div className="px-4 pb-6">
          <div className="max-w-4xl mx-auto">
            {!isLoggedIn && onLoginClick && (
              <AnonymousUsageIndicator onLoginClick={onLoginClick} />
            )}
            
            <form onSubmit={handleSubmit}>
              <div className={`relative rounded-2xl border ${
                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              } shadow-sm`}>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Typ je bericht hier..."
                  className={`w-full px-4 py-3 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                    isDark 
                      ? 'bg-gray-800 text-white placeholder-gray-400' 
                      : 'bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  style={{ fontFamily: customization.fontFamily }}
                  rows={1}
                />
                
                <div className="flex items-center justify-between px-4 pb-3">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    availableModels={availableModels}
                    isDark={isDark}
                    customization={customization}
                  />
                  
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isGenerating}
                    className="text-white p-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
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
