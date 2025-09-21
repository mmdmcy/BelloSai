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
import { CustomizationSettings } from '../types/app';
import type { ModelInfo } from '../types/app';
import AnonymousUsageIndicator from './AnonymousUsageIndicator';
import { useTheme } from '../contexts/ThemeContext';

interface MainContentProps {
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
  hasActiveSubscription?: boolean;
}

export default function MainContent({
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
  hasActiveSubscription = false
}: MainContentProps) {
  const { isDark, hasGlassEffect, getCurrentColors } = useTheme();
  const glassActive = hasGlassEffect();
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
   * Get current theme colors
   */
  const currentColors = getCurrentColors();
  const heroCardClass = glassActive
    ? 'glass-card border border-theme shadow-theme-glow'
    : 'rounded-theme bg-theme-surface border border-theme shadow-theme';
  const inputShellClass = glassActive
    ? 'glass-card border border-theme shadow-theme-soft'
    : 'rounded-theme bg-theme-surface border border-theme shadow-theme-soft';
  const sampleQuestionClass = glassActive
    ? 'glass-button text-theme hover:border-theme-accent'
    : 'bg-theme-surface-accent text-theme hover:bg-theme-accent hover:text-theme-inverse shadow-theme-soft';
  const accentActionClass = glassActive
    ? 'glass-button text-theme'
    : 'bg-theme-accent text-theme-inverse shadow-theme-soft';

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
            <div className={`relative ${inputShellClass}`}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className={`w-full px-6 py-4 pr-32 rounded-2xl ios-input resize-none focus:outline-none min-h-[60px] max-h-32`}
                style={{
                  fontFamily: customization.fontFamily,
                  backgroundColor: 'transparent',
                  color: currentColors.text
                }}
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
                    className={`p-2.5 rounded-theme ios-pressable transition-transform duration-200 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed ${accentActionClass}`}
                    style={!glassActive
                      ? {
                          background: customization.gradientEnabled
                            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                            : customization.primaryColor,
                          color: 'var(--color-text-inverse)'
                        }
                      : undefined}
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
      className="flex-1 h-full flex flex-col"
      style={{ background: 'transparent' }}
    >
      {/* Main Content Area - Responsive scaling */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div
          className={`${heroCardClass} w-full text-center px-8 py-10`}
          style={{
            maxWidth: getResponsiveMaxWidth(),
            fontFamily: customization.fontFamily,
            background: !glassActive && customization.gradientEnabled
              ? `linear-gradient(135deg, ${customization.primaryColor}0f, ${customization.secondaryColor}14)`
              : undefined
          }}
        >
          {/* Main Heading - Responsive text size */}
          <h1
            className={`${containerWidth < 600 ? 'text-2xl' : containerWidth < 1200 ? 'text-3xl' : 'text-4xl'} font-semibold mb-10`}
            style={{
              fontFamily: customization.fontFamily,
              color: currentColors.text
            }}
          >
            How can I help you?
          </h1>

          {/* Action Buttons - Responsive layout */}
          <div className={`flex flex-wrap justify-center gap-3 mb-12 ${containerWidth < 600 ? 'gap-2' : 'gap-3'}`}>
            <ActionButton icon={Sparkles} label="Create" themeColors={currentColors} customization={customization} />
            <ActionButton icon={Compass} label="Explore" themeColors={currentColors} customization={customization} />
            <ActionButton icon={Code} label="Code" themeColors={currentColors} customization={customization} />
            <ActionButton icon={GraduationCap} label="Learn" themeColors={currentColors} customization={customization} />
          </div>

          {/* Sample Questions - Only show if enabled in customization, responsive spacing */}
          {customization.showQuestions && (
            <div className={`space-y-3 ${containerWidth < 600 ? 'mb-8' : 'mb-16'}`}>
              {questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  className={`block w-full text-left rounded-theme ios-pressable transition-all ${sampleQuestionClass} ${
                    containerWidth < 600 ? 'text-sm px-4 py-3' : 'px-6 py-3.5'
                  }`}
                  style={{ fontFamily: customization.fontFamily }}
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
              className="text-xs text-center mb-6"
              style={{
                fontFamily: customization.fontFamily,
                color: currentColors.text
              }}
            >
              Make sure you agree to the{' '}
              <a
                href="#"
                className="underline hover:no-underline"
                style={{
                  color: customization.primaryColor
                }}
              >
                Terms
              </a>
              {' '}and the{' '}
              <a
                href="#"
                className="underline hover:no-underline"
                style={{
                  color: customization.primaryColor
                }}
              >
                Privacy Policy
              </a>
            </p>

            <form onSubmit={handleSubmit}>
              {/* Message Input - Responsive sizing */}
              <div className={`relative ${inputShellClass}`}>
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  className="w-full px-6 py-4 pr-32 rounded-2xl ios-input resize-none focus:outline-none min-h-[60px] max-h-32"
                  style={{
                    fontFamily: customization.fontFamily,
                    backgroundColor: 'transparent',
                    color: currentColors.text
                  }}
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
                    className="p-2.5 rounded-xl ios-pressable hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: customization.gradientEnabled
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor,
                      color: 'white'
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
