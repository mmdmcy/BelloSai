/**
 * MainContent Component
 * 
 * This component renders the main welcome screen of the application when no chat is active.
 * It displays the application's primary interface including:
 * - Welcome message and branding
 * - Action buttons for common tasks
 * - Sample questions for user interaction
 * - Message input interface
 * 
 * Features:
 * - Responsive design with centered layout
 * - Customizable theming and colors
 * - Sample questions that can be toggled on/off
 * - Dual rendering modes (full content or input-only)
 * - Auto-resizing textarea for message input
 * - Model selection dropdown
 * - Dynamic scaling based on container size
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Compass, Code, GraduationCap, ChevronDown, ArrowUp } from 'lucide-react';
import ActionButton from './ActionButton';
import ModelSelector from './ModelSelector';
import { CustomizationSettings } from '../App';
import type { ModelInfo } from '../App';
import AnonymousUsageIndicator from './AnonymousUsageIndicator';

interface MainContentProps {
  isDark: boolean;
  onSendMessage: (message: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  hideInput?: boolean;
  inputOnly?: boolean;
  customization: CustomizationSettings;
  isGenerating?: boolean;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  hasGlassEffect?: boolean;
  hasActiveSubscription?: boolean;
}

export default function MainContent({ 
  isDark, 
  onSendMessage, 
  selectedModel, 
  onModelChange, 
  availableModels,
  hideInput = false,
  inputOnly = false,
  customization,
  isGenerating = false,
  isLoggedIn = false,
  onLoginClick,
  hasGlassEffect = false,
  hasActiveSubscription = false
}: MainContentProps) {
  // Input state management
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Sample questions for user interaction
  const questions = [
    "How does AI work?",
    "Are black holes real?",
    "How many Rs are in the word \"strawberry\"?",
    "What is the meaning of life?"
  ];

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
   * Calculate responsive max width based on container size
   */
  const getResponsiveMaxWidth = () => {
    if (containerWidth < 600) return '95%';
    if (containerWidth < 800) return '90%';
    if (containerWidth < 1200) return '80%';
    return '70%';
  };

  /**
   * Helper function to get appropriate text color in dark mode
   * Adapts colors based on theme and customization settings
   */
  const getTextColor = (baseColor: string, isDark: boolean) => {
    if (isDark) {
      // In dark mode, use custom secondary color if it's not default, otherwise use gray
      return customization.secondaryColor !== '#a855f7' ? customization.secondaryColor : '#9CA3AF';
    }
    return baseColor;
  };

  /**
   * Handle form submission for message input
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  /**
   * Handle clicking on sample questions
   * Sends the question as a message to start conversation
   */
  const handleQuestionClick = (question: string) => {
    onSendMessage(question);
  };

  /**
   * Handle keyboard shortcuts in textarea
   * Enter submits, Shift+Enter creates new line
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

  // Input-only mode - renders just the message input interface with responsive sizing
  if (inputOnly) {
    return (
      <div className="h-full flex items-end" ref={containerRef}>
        <div className="w-full">
          {/* Anonymous Usage Indicator */}
          {!isLoggedIn && onLoginClick && (
            <AnonymousUsageIndicator onLoginClick={onLoginClick} />
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Message Input Container */}
            <div className={`relative rounded-2xl ${
              hasGlassEffect && !isDark 
                ? 'glass-input' 
                : `border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-purple-200'} shadow-sm`
            }`}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className={`w-full px-6 py-4 pr-32 rounded-2xl resize-none focus:outline-none min-h-[60px] max-h-32 ${
                  hasGlassEffect && !isDark 
                    ? 'bg-transparent text-gray-800 placeholder-gray-600' 
                    : isDark 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
                style={{ fontFamily: customization.fontFamily }}
                rows={1}
              />
              
              {/* Bottom Controls */}
              <div className="flex items-center justify-between px-6 pb-4">
                <div className="flex items-center gap-4">
                  {/* Model Selector */}
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    availableModels={availableModels}
                    isDark={isDark}
                    customization={customization}
                    hasActiveSubscription={hasActiveSubscription}
                  />

                </div>
                
                {/* Send Button */}
                                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className={`${
                      hasGlassEffect && !isDark 
                        ? 'glass-button-modern text-gray-800' 
                        : 'text-white'
                    } p-2.5 rounded-xl transition-colors hover:opacity-90 disabled:opacity-50`}
                    style={{ 
                      background: !hasGlassEffect 
                        ? (customization.gradientEnabled 
                            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                            : customization.primaryColor)
                        : undefined
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

  // Full main content layout with responsive scaling
  return (
    <div 
      ref={containerRef}
      className={`flex-1 h-full flex flex-col ${
        hasGlassEffect && !isDark 
          ? 'bg-transparent' 
          : isDark 
            ? 'bg-gray-900' 
            : 'bg-purple-50'
      }`}
      style={{
        background: !hasGlassEffect && customization.gradientEnabled && !isDark 
          ? `linear-gradient(135deg, ${customization.primaryColor}05, ${customization.secondaryColor}05)`
          : undefined
      }}
    >
      {/* Main Content Area - Responsive scaling */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full text-center" style={{ maxWidth: getResponsiveMaxWidth() }}>
          {/* Main Heading - Responsive text size */}
          <h1 
            className={`${containerWidth < 600 ? 'text-2xl' : containerWidth < 1200 ? 'text-3xl' : 'text-4xl'} font-semibold mb-10 ${
              hasGlassEffect && !isDark 
                ? 'text-gray-800' 
                : isDark 
                  ? 'text-white' 
                  : 'text-purple-800'
            }`}
            style={{ 
              fontFamily: customization.fontFamily,
              color: hasGlassEffect && !isDark 
                ? '#1f2937'
                : isDark 
                  ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                  : customization.primaryColor 
            }}
          >
            How can I help you?
          </h1>

          {/* Action Buttons - Responsive layout */}
          <div className={`flex flex-wrap justify-center gap-3 mb-12 ${containerWidth < 600 ? 'gap-2' : 'gap-3'}`}>
            <ActionButton icon={Sparkles} label="Create" isDark={isDark} customization={customization} />
            <ActionButton icon={Compass} label="Explore" isDark={isDark} customization={customization} />
            <ActionButton icon={Code} label="Code" isDark={isDark} customization={customization} />
            <ActionButton icon={GraduationCap} label="Learn" isDark={isDark} customization={customization} />
          </div>

          {/* Sample Questions - Only show if enabled in customization, responsive spacing */}
          {customization.showQuestions && (
            <div className={`space-y-3 ${containerWidth < 600 ? 'mb-8' : 'mb-16'}`}>
              {questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  className={`block w-full text-left px-6 py-3.5 rounded-xl transition-colors ${
                    hasGlassEffect && !isDark
                      ? 'text-gray-700 hover:bg-white/30 hover:text-gray-800'
                      : isDark 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'hover:text-purple-800'
                  } ${containerWidth < 600 ? 'text-sm px-4 py-3' : 'px-6 py-3.5'}`}
                  style={{ 
                    fontFamily: customization.fontFamily,
                    color: hasGlassEffect && !isDark 
                      ? '#374151'
                      : getTextColor(customization.primaryColor + 'CC', isDark)
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

      {/* Footer Section with Input - Responsive sizing */}
      {!hideInput && (
        <div className="px-8 pb-6">
          <div className="w-full mx-auto" style={{ maxWidth: getResponsiveMaxWidth() }}>
            {/* Anonymous Usage Indicator */}
            {!isLoggedIn && onLoginClick && (
              <AnonymousUsageIndicator onLoginClick={onLoginClick} />
            )}
            
            {/* Terms and Privacy Links */}
            <p 
              className={`text-xs text-center mb-6 ${
                hasGlassEffect && !isDark 
                  ? 'text-gray-600' 
                  : isDark 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
              }`}
              style={{ fontFamily: customization.fontFamily }}
            >
              Make sure you agree to the{' '}
              <a 
                href="#" 
                className={`underline hover:no-underline ${
                  hasGlassEffect && !isDark 
                    ? 'text-gray-700' 
                    : isDark 
                      ? 'text-gray-300' 
                      : ''
                }`}
                style={{ 
                  color: hasGlassEffect && !isDark 
                    ? '#374151'
                    : isDark 
                      ? undefined 
                      : customization.primaryColor 
                }}
              >
                Terms
              </a>
              {' '}and the{' '}
              <a 
                href="#" 
                className={`underline hover:no-underline ${
                  hasGlassEffect && !isDark 
                    ? 'text-gray-700' 
                    : isDark 
                      ? 'text-gray-300' 
                      : ''
                }`}
                style={{ 
                  color: hasGlassEffect && !isDark 
                    ? '#374151'
                    : isDark 
                      ? undefined 
                      : customization.primaryColor 
                }}
              >
                Privacy Policy
              </a>
            </p>

            <form onSubmit={handleSubmit}>
              {/* Message Input - Responsive sizing */}
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
                    hasGlassEffect && !isDark 
                      ? 'bg-transparent text-gray-800 placeholder-gray-600' 
                      : isDark 
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
                      hasActiveSubscription={hasActiveSubscription}
                    />

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
