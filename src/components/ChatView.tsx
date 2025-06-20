/**
 * ChatView Component - Main Chat Interface
 * 
 * This is the primary chat interface component that handles user interactions
 * with AI models. It provides a modern, responsive design with real-time messaging,
 * markdown rendering, and advanced features like message regeneration and sharing.
 * 
 * Features:
 * - Real-time streaming message display with typing indicators
 * - Advanced markdown rendering with syntax highlighting for code
 * - Legacy message format conversion and preprocessing
 * - Model selection dropdown with capability indicators
 * - Message regeneration and copy functionality
 * - Chat sharing capabilities with public links
 * - Anonymous usage tracking and limits display
 * - Responsive design for mobile and desktop
 * - Theme support with customizable styling
 * 
 * Technical Implementation:
 * - Uses ReactMarkdown with GitHub Flavored Markdown support
 * - Implements syntax highlighting via rehype-highlight
 * - Handles legacy code format conversion for backward compatibility
 * - Optimized rendering with React.memo for performance
 * - Responsive layout using Tailwind CSS classes
 * 
 * Message Processing:
 * - Automatically detects and formats code blocks from legacy messages
 * - Supports multiple programming languages with proper syntax highlighting
 * - Handles mixed content (text + code) gracefully
 * - Preserves message formatting while improving readability
 * 
 * State Management:
 * - Controlled component receiving messages and handlers from parent
 * - Local state for UI interactions (model selector, copy feedback)
 * - Error handling and display for failed operations
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ArrowUp, Copy, RotateCcw } from 'lucide-react';
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

// Helper function to detect and format code in legacy messages
const preprocessLegacyContent = (content: string): string => {
  // Check if content already has proper markdown code blocks
  if (content.includes('```')) {
    return content;
  }
  
  // Handle the specific OLD format pattern: ":### Pythonpythonprint('hello')### JavaScriptjavascriptconsole.log('hello')"
  // This pattern has :### or ### followed by language name+code, then actual code
  const oldLegacyPattern = /:?###\s*([A-Z][a-z]*?)([a-z+#]+)(.*?)(?=###|$)/g;
  const oldMatches = [...content.matchAll(oldLegacyPattern)];
  
  if (oldMatches.length > 0) {
    console.log('🔧 Found old legacy code format, converting...', oldMatches.length, 'matches');
    let result = '';
    oldMatches.forEach((match, index) => {
      const [fullMatch, displayName, langCode, code] = match;
      console.log('🔧 Processing match:', { fullMatch, displayName, langCode, code: code.substring(0, 50) + '...' });
      
      const cleanDisplayName = displayName.trim();
      const cleanCode = code.trim();
      
      // Map language codes to proper identifiers
      const langMap: { [key: string]: string } = {
        'python': 'python',
        'javascript': 'javascript', 
        'java': 'java',
        'cpp': 'cpp',
        'csharp': 'csharp',
        'ruby': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'go': 'go',
        'html': 'html',
        'css': 'css',
        'typescript': 'typescript'
      };
      
      const properLang = langMap[langCode.toLowerCase()] || langCode.toLowerCase();
      
      if (index > 0) result += '\n\n';
      result += `### ${cleanDisplayName}\n\`\`\`${properLang}\n${cleanCode}\n\`\`\`\n`;
    });
    console.log('🔧 Converted result:', result.substring(0, 200) + '...');
    return result;
  }
  
  // Handle the newer pattern from legacy messages: "languagenameCodeHere###NextLanguage"
  const legacyCodePattern = /([a-zA-Z+#]+)((?:(?!###).)+)(?:###|$)/g;
  const matches = [...content.matchAll(legacyCodePattern)];
  
  if (matches.length > 1) {
    // Multiple code blocks detected, format each one
    let result = '';
    matches.forEach((match, index) => {
      const [, language, code] = match;
      const cleanLanguage = language.toLowerCase();
      const cleanCode = code.trim();
      
      if (index > 0) result += '\n\n';
      result += `### ${language}\n\`\`\`${cleanLanguage}\n${cleanCode}\n\`\`\`\n`;
    });
    return result;
  }
  
  // Single code block detection patterns - only if content starts with language name
  const singleCodePatterns = [
    { pattern: /^(python|py)\s*([\s\S]+)$/i, lang: 'python' },
    { pattern: /^(javascript|js)\s*([\s\S]+)$/i, lang: 'javascript' },
    { pattern: /^(typescript|ts)\s*([\s\S]+)$/i, lang: 'typescript' },
    { pattern: /^(html)\s*([\s\S]+)$/i, lang: 'html' },
    { pattern: /^(css)\s*([\s\S]+)$/i, lang: 'css' },
    { pattern: /^(java)\s*([\s\S]+)$/i, lang: 'java' },
    { pattern: /^(c\+\+|cpp)\s*([\s\S]+)$/i, lang: 'cpp' },
    { pattern: /^(c#|csharp)\s*([\s\S]+)$/i, lang: 'csharp' },
    { pattern: /^(ruby|rb)\s*([\s\S]+)$/i, lang: 'ruby' },
    { pattern: /^(php)\s*([\s\S]+)$/i, lang: 'php' },
    { pattern: /^(swift)\s*([\s\S]+)$/i, lang: 'swift' },
    { pattern: /^(go|golang)\s*([\s\S]+)$/i, lang: 'go' }
  ];
  
  for (const { pattern, lang } of singleCodePatterns) {
    const match = content.match(pattern);
    if (match) {
      const code = match[2].trim();
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }
  }
  
  // Very strict code detection patterns - must have multiple clear indicators
  const hasSpecificCodeStructure = (
    // Function definitions with proper syntax
    (/def\s+\w+\s*\([^)]*\)\s*:/.test(content) && /\n\s+/.test(content)) ||
    (/function\s+\w+\s*\([^)]*\)\s*\{/.test(content) && /\}/.test(content)) ||
    // Class definitions with structure
    (/class\s+\w+\s*[\{:]/.test(content) && (/\n\s+/.test(content) || /\}/.test(content))) ||
    // Import/export statements
    (/^(import|from|export|require)\s+.+$/m.test(content) && content.includes('\n')) ||
    // Code with semicolons and braces (clear programming structure)
    (content.includes(';') && content.includes('{') && content.includes('}')) ||
    // HTML tags with attributes
    (/<\w+[^>]*>[\s\S]*<\/\w+>/.test(content)) ||
    // CSS with selectors and properties
    (/[.#]?\w+\s*\{[\s\S]*\}/.test(content) && content.includes(':') && content.includes(';'))
  );
  
  // Only treat as code if there are clear structural indicators AND it's substantial
  if (hasSpecificCodeStructure && content.length > 30) {
    // Try to detect language based on specific patterns
    let language = '';
    if (/def\s+\w+\s*\([^)]*\)\s*:/.test(content) || /import\s+\w+/.test(content)) {
      language = 'python';
    } else if (/function\s+\w+\s*\([^)]*\)\s*\{/.test(content) || /(const|let|var)\s+\w+\s*=/.test(content)) {
      language = 'javascript';
    } else if (/<\w+[^>]*>[\s\S]*<\/\w+>/.test(content)) {
      language = 'html';
    } else if (/[.#]?\w+\s*\{[\s\S]*\}/.test(content) && content.includes(':') && content.includes(';')) {
      language = 'css';
    } else if (/public\s+class\s+\w+/.test(content) || /System\.out\.println/.test(content)) {
      language = 'java';
    } else if (/#include\s*<.+>/.test(content) || /std::/.test(content)) {
      language = 'cpp';
    }
    
    return `\`\`\`${language}\n${content}\n\`\`\``;
  }
  
  // Return content as-is for normal text
  return content;
};

// Modern markdown component without complex styling
const MarkdownContent: React.FC<{ 
  content: string; 
  isDark: boolean; 
  customization: CustomizationSettings;
}> = React.memo(({ content, isDark, customization }) => {
  // Preprocess content to handle legacy code formatting
  const processedContent = preprocessLegacyContent(content);
  
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
          pre: ({ children, ...props }) => {
            // Extract language from className if available
            const codeElement = children as any;
            const className = codeElement?.props?.className || '';
            const language = className.replace('language-', '') || 'text';
            
            // Extract the actual code content
            let codeContent = '';
            try {
              if (codeElement?.props?.children) {
                if (typeof codeElement.props.children === 'string') {
                  codeContent = codeElement.props.children;
                } else if (Array.isArray(codeElement.props.children)) {
                  codeContent = codeElement.props.children.join('');
                } else {
                  codeContent = String(codeElement.props.children);
                }
              }
            } catch (e) {
              codeContent = 'Code content unavailable';
            }

            return (
              <div className={`rounded-lg overflow-hidden mb-4 ${
                isDark ? 'bg-gray-900' : 'bg-gray-50'
              } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
                  <span className="text-sm font-medium">
                    {language !== 'text' ? language.toUpperCase() : 'Code'}
                  </span>
                  <button 
                    className="p-1 rounded hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      if (codeContent) {
                        navigator.clipboard.writeText(codeContent);
                      }
                    }}
                    title="Copy code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <pre 
                    {...props}
                    className={`text-sm overflow-x-auto m-0 ${
                      isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}
                    style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                  >
                    {children}
                  </pre>
                </div>
              </div>
            );
          },
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
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

// Enhanced Model Selector with website theming
const ThemedModelSelector: React.FC<{
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  isDark: boolean;
  customization: CustomizationSettings;
}> = ({ selectedModel, onModelChange, availableModels, isDark, customization }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedModelInfo = availableModels.find(m => m.code === selectedModel);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-white font-medium`}
        style={{ 
          backgroundColor: customization.primaryColor,
          fontFamily: customization.fontFamily 
        }}
      >
        <span className="text-sm">{selectedModelInfo?.name || 'Model'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 w-64 rounded-xl border shadow-lg z-10 ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            {availableModels.map((model) => (
              <button
                key={model.code}
                onClick={() => {
                  onModelChange(model.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedModel === model.code
                    ? `text-white`
                    : isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedModel === model.code ? customization.primaryColor : 'transparent',
                  fontFamily: customization.fontFamily
                }}
              >
                <div className="font-medium text-sm">{model.name}</div>
                <div className={`text-xs mt-1 ${
                  selectedModel === model.code
                    ? 'text-white/80'
                    : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {model.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
    const isReasoningModel = message.model === 'DeepSeek-R1' || message.model?.includes('gemini-1.5-pro');
    const shouldShowReasoning = isLastAiMessage && isGenerating && isReasoningModel && !message.content;
    const shouldShowRegularLoading = isLastAiMessage && isGenerating && !isReasoningModel && !message.content;
    
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
            {/* Show reasoning indicator for R1 and Gemini 2.5 Pro when they haven't started generating content */}
            {shouldShowReasoning && (
              <div className="mb-3 flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span 
                    className="text-blue-500 font-medium"
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    Reasoning...
                  </span>
                </div>
              </div>
            )}
            
            {/* Show pretty loading indicator for non-reasoning models when they haven't started generating content */}
            {shouldShowRegularLoading && (
              <div className="mb-3 flex items-center space-x-3">
                <div className="flex items-center space-x-3">
                  {/* Elegant pulsing circle loader */}
                  <div className="relative">
                    <div 
                      className="w-8 h-8 rounded-full opacity-20 animate-ping"
                      style={{ backgroundColor: customization.primaryColor }}
                    ></div>
                    <div 
                      className="absolute inset-0 w-8 h-8 rounded-full opacity-40 animate-pulse"
                      style={{ backgroundColor: customization.primaryColor }}
                    ></div>
                    <div 
                      className="absolute inset-1 w-6 h-6 rounded-full opacity-60"
                      style={{ backgroundColor: customization.primaryColor }}
                    ></div>
                  </div>
                                     <span 
                     className="font-medium animate-pulse"
                     style={{ 
                       color: customization.primaryColor,
                       fontFamily: customization.fontFamily 
                     }}
                   >
                     Loading...
                   </span>
                </div>
              </div>
            )}
            
            {/* Only show content if message has content */}
            {message.content && (
              <div className="mb-3">
                <MarkdownContent 
                  content={message.content}
                  isDark={isDark}
                  customization={customization}
                />
              </div>
            )}
            
            {/* Only show model info and actions when response is complete (not generating) */}
            {message.content && !(isLastAiMessage && isGenerating) && (
              <div className="flex items-center justify-start px-2">
                <div className="flex items-center space-x-3">
                  {message.model && (
                    <span 
                      className={`text-xs px-3 py-1.5 rounded-full text-white font-medium`}
                      style={{ 
                        backgroundColor: customization.secondaryColor,
                        fontFamily: customization.fontFamily 
                      }}
                    >
                      {availableModels.find(m => m.code === message.model)?.name || message.model}
                    </span>
                  )}
                  
                  {/* Action buttons always next to model name */}
                  <div className="flex items-center space-x-1">
                    <button 
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      title="Copy message"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    
                    {onRegenerateResponse && isLastAiMessage && (
                      <button 
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        onClick={onRegenerateResponse}
                        disabled={isGenerating}
                        title="Regenerate response"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  }, [customization, isDark, isGenerating, onRegenerateResponse, availableModels]);

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
                placeholder="Type your message here..."
                className={`w-full px-4 py-3 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                  isDark 
                    ? 'bg-gray-800 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
                style={{ fontFamily: customization.fontFamily }}
                rows={1}
              />
              
              <div className="flex items-center justify-between px-4 pb-3">
                <ThemedModelSelector
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
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      
      {/* Chat Messages Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => renderMessage(message, index))}
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
                  placeholder="Type your message here..."
                  className={`w-full px-4 py-3 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                    isDark 
                      ? 'bg-gray-800 text-white placeholder-gray-400' 
                      : 'bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  style={{ fontFamily: customization.fontFamily }}
                  rows={1}
                />
                
                <div className="flex items-center justify-between px-4 pb-3">
                  <ThemedModelSelector
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
