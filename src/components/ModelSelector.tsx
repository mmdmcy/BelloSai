/**
 * ModelSelector Component
 * 
 * A simplified dropdown component for selecting AI models in the chat interface.
 * Clean design matching the provided reference image.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Brain, Sparkles } from 'lucide-react';
import { CustomizationSettings } from '../App';
import type { ModelInfo } from '../App';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  isDark: boolean;
  customization: CustomizationSettings;
}

const PROVIDER_ICON: Record<string, any> = {
  Gemini: Sparkles,
  DeepSeek: () => <span className="text-base">🐋</span>, // Whale emoji for DeepSeek
};

const PROVIDER_COLOR: Record<string, string> = {
  Gemini: '#a855f7', // paars
  DeepSeek: '#2563eb', // blauw
};

export default function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  availableModels, 
  isDark,
  customization
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleModelSelect = (modelCode: string) => {
    onModelChange(modelCode);
    setIsOpen(false);
  };

  const selectedModelInfo = availableModels.find(m => m.code === selectedModel);
  const ProviderIcon = selectedModelInfo ? PROVIDER_ICON[selectedModelInfo.provider] : Brain;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-white ${isOpen ? 'ring-2 ring-opacity-50' : ''}`}
        style={{ 
          fontFamily: customization.fontFamily,
          backgroundColor: customization.primaryColor,
          '--tw-ring-color': customization.secondaryColor
        } as React.CSSProperties}
      >
        <ProviderIcon className="w-3.5 h-3.5 opacity-80" />
        <span className="truncate">
          {selectedModelInfo?.name || selectedModel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute bottom-full left-0 mb-2 min-w-64 rounded-lg border shadow-lg z-50 ${
            isDark 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="py-1">
            {availableModels.map((model) => {
              const isSelected = model.code === selectedModel;
              const ModelProviderIcon = PROVIDER_ICON[model.provider];
              const providerColor = PROVIDER_COLOR[model.provider];
              
              return (
                <button
                  key={model.code}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } ${isSelected ? (isDark ? 'bg-gray-700' : 'bg-purple-50') : ''}`}
                  onClick={() => handleModelSelect(model.code)}
                >
                  <ModelProviderIcon 
                    className="w-4 h-4" 
                    style={{ color: providerColor }}
                  />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {model.name}
                  </span>
                  {isSelected && (
                    <div 
                      className="ml-auto w-2 h-2 rounded-full"
                      style={{ backgroundColor: providerColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
