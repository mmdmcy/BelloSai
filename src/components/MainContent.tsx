import React, { useState, useRef } from 'react';
import { Sparkles, Compass, Code, GraduationCap, ChevronDown, Search, Paperclip, ArrowUp } from 'lucide-react';
import ActionButton from './ActionButton';
import ModelSelector from './ModelSelector';
import { CustomizationSettings } from '../App';

interface MainContentProps {
  isDark: boolean;
  onSendMessage: (message: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  hideInput?: boolean;
  inputOnly?: boolean;
  customization: CustomizationSettings;
}

export default function MainContent({ 
  isDark, 
  onSendMessage, 
  selectedModel, 
  onModelChange, 
  availableModels,
  hideInput = false,
  inputOnly = false,
  customization
}: MainContentProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const questions = [
    "How does AI work?",
    "Are black holes real?",
    "How many Rs are in the word \"strawberry\"?",
    "What is the meaning of life?"
  ];

  // Helper function to get appropriate text color in dark mode
  const getTextColor = (baseColor: string, isDark: boolean) => {
    if (isDark) {
      // In dark mode, use custom secondary color if it's not default, otherwise use gray
      return customization.secondaryColor !== '#a855f7' ? customization.secondaryColor : '#9CA3AF';
    }
    return baseColor;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleQuestionClick = (question: string) => {
    onSendMessage(question);
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
                  style={{ 
                    background: customization.gradientEnabled 
                      ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                      : customization.primaryColor 
                  }}
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
    <div 
      className={`flex-1 h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}
      style={{
        background: customization.gradientEnabled && !isDark 
          ? `linear-gradient(135deg, ${customization.primaryColor}05, ${customization.secondaryColor}05)`
          : undefined
      }}
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="max-w-2xl w-full text-center">
          <h1 
            className={`text-4xl font-semibold mb-10 ${isDark ? 'text-white' : 'text-purple-800'}`}
            style={{ 
              fontFamily: customization.fontFamily,
              color: isDark 
                ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                : customization.primaryColor 
            }}
          >
            How can I help you?
          </h1>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <ActionButton icon={Sparkles} label="Create" isDark={isDark} customization={customization} />
            <ActionButton icon={Compass} label="Explore" isDark={isDark} customization={customization} />
            <ActionButton icon={Code} label="Code" isDark={isDark} customization={customization} />
            <ActionButton icon={GraduationCap} label="Learn" isDark={isDark} customization={customization} />
          </div>

          {/* Sample Questions */}
          {customization.showQuestions && (
            <div className="space-y-3 mb-16">
              {questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  className={`block w-full text-left px-6 py-3.5 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'hover:text-purple-800'
                  }`}
                  style={{ 
                    fontFamily: customization.fontFamily,
                    color: getTextColor(customization.primaryColor + 'CC', isDark)
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

      {/* Footer */}
      {!hideInput && (
        <div className="px-8 pb-6">
          <div className="max-w-2xl mx-auto">
            <p 
              className={`text-xs text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ fontFamily: customization.fontFamily }}
            >
              Make sure you agree to our{' '}
              <a 
                href="#" 
                className={`underline hover:no-underline ${isDark ? 'text-gray-300' : ''}`}
                style={{ color: isDark ? undefined : customization.primaryColor }}
              >
                Terms
              </a>
              {' '}and our{' '}
              <a 
                href="#" 
                className={`underline hover:no-underline ${isDark ? 'text-gray-300' : ''}`}
                style={{ color: isDark ? undefined : customization.primaryColor }}
              >
                Privacy Policy
              </a>
            </p>

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
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor 
                    }}
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