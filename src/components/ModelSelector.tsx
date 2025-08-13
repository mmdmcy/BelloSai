/**
 * ModelSelector Component
 * 
 * A simplified dropdown component for selecting AI models in the chat interface.
 * Clean design matching the provided reference image.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Brain, Sparkles, Feather, Star, Lock } from 'lucide-react';
import { CustomizationSettings } from '../types/app';
import type { ModelInfo } from '../types/app';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  isDark: boolean;
  customization: CustomizationSettings;
  hasActiveSubscription?: boolean;
}

const PROVIDER_ICON: Record<string, any> = {
  DeepSeek: () => <span className="text-base">🐋</span>, // Whale emoji for DeepSeek
  Claude: Feather,
  Mistral: Star,
};

const PROVIDER_COLOR: Record<string, string> = {
  DeepSeek: '#2563eb', // blue
  Claude: '#fbbf24', // yellow/orange
  Mistral: '#ef4444', // red
};

export default function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  availableModels, 
  isDark,
  customization,
  hasActiveSubscription = false
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
              const isPremium = model.premium;
              const isDisabled = isPremium && !hasActiveSubscription;
              return (
                <button
                  key={model.code}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } ${isSelected ? (isDark ? 'bg-gray-700' : 'bg-purple-50') : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isDisabled && handleModelSelect(model.code)}
                  disabled={isDisabled}
                >
                  <ModelProviderIcon 
                    className="w-4 h-4" 
                    style={{ color: providerColor }}
                  />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {model.name}
                  </span>
                  {isPremium && !hasActiveSubscription && (
                    <Lock className="w-4 h-4 text-gray-400 ml-2" />
                  )}
                  {isSelected && !isDisabled && (
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
