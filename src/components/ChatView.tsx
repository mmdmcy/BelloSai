import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Paperclip, ArrowUp, Copy, RotateCcw } from 'lucide-react';
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
  customization
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'user') {
      return (
        <div key={message.id} className="flex justify-end mb-6">
          <div 
            className="max-w-md px-4 py-2.5 rounded-2xl text-white"
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
      // Check if message contains code
      const hasCode = message.content.includes('```');
      
      if (hasCode) {
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
            <div className="max-w-2xl w-full">
              {beforeCode && (
                <p 
                  className={`mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  {beforeCode.trim()}
                </p>
              )}
              
              {/* Code Block */}
              <div className={`rounded-xl overflow-hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } border ${isDark ? 'border-gray-700' : 'border-purple-200'}`}>
                {/* Code Header */}
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
                
                {/* Code Content */}
                <div className="p-4">
                  <pre 
                    className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                    style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                  >
                    <code>{code}</code>
                  </pre>
                </div>
              </div>

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
                  <RotateCcw className="w-4 h-4" />
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
        return (
          <div key={message.id} className="flex justify-start mb-6">
            <div className="max-w-2xl">
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
                  <RotateCcw className="w-4 h-4" />
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

  // If inputOnly is true, only render the input section
  if (inputOnly) {
    return (
      <div className="h-full flex items-end">
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

  return (
    <div className={`flex-1 h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}>
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
          
          {/* Scroll to bottom indicator */}
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

      {/* Message Input Footer */}
      {!hideInput && (
        <div className="px-8 pb-6">
          <div className="max-w-3xl mx-auto">
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