/**
 * ModelSelector Component
 * 
 * A dropdown component for selecting AI models in the chat interface.
 * Provides a clean interface for switching between different AI models.
 * 
 * Features:
 * - Dropdown interface with smooth animations
 * - Click outside to close functionality
 * - Customizable theming and colors
 * - Keyboard navigation support
 * - Model highlighting for current selection
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  isDark: boolean;
  customization: CustomizationSettings;
}

export default function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  availableModels, 
  isDark,
  customization
}: ModelSelectorProps) {
  // Dropdown state management
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Handle clicking outside the dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Handle model selection and close dropdown
   */
  const handleModelSelect = (model: string) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
          isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'
        }`}
        style={{ 
          fontFamily: customization.fontFamily,
          color: isDark ? undefined : customization.primaryColor 
        }}
      >
        {selectedModel}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute bottom-full left-0 mb-2 min-w-48 rounded-lg border shadow-lg z-50 ${
          isDark 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-white border-purple-200'
        }`}>
          <div className="py-1">
            {availableModels.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => handleModelSelect(model)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  model === selectedModel
                    ? isDark
                      ? 'text-white'
                      : 'text-purple-800'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-600 hover:text-white'
                      : 'text-gray-700 hover:text-purple-800'
                }`}
                style={{ 
                  fontFamily: customization.fontFamily,
                  // Highlight selected model with custom color
                  backgroundColor: model === selectedModel 
                    ? (isDark ? customization.primaryColor : customization.primaryColor + '20')
                    : undefined
                }}
                // Dynamic hover effects
                onMouseEnter={(e) => {
                  if (!isDark && model !== selectedModel) {
                    e.currentTarget.style.backgroundColor = customization.primaryColor + '10';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDark && model !== selectedModel) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}