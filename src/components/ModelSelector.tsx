/**
 * ModelSelector Component
 * 
 * A dropdown component for selecting AI models in the chat interface.
 * Provides a clean interface for switching between different AI models.
 * 
 * Features:
 * - Compact pill-shaped design for chatbox
 * - Dropdown interface with smooth animations
 * - Click outside to close functionality
 * - Customizable theming and colors
 * - Keyboard navigation support
 * - Model highlighting for current selection
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Info, FileText, Image, Mic, Video, Code, FunctionSquare, Database, ListChecks, Globe, SlidersHorizontal, Brain, Sparkles } from 'lucide-react';
import { CustomizationSettings } from '../App';
import type { ModelInfo } from '../App';
import { MODEL_CAPABILITIES } from '../App';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  isDark: boolean;
  customization: CustomizationSettings;
}

const ICON_MAP: Record<string, any> = {
  FileText,
  Image,
  Mic,
  Video,
  Code,
  FunctionSquare,
  Database,
  ListChecks,
  Globe,
  SlidersHorizontal,
  Brain,
};

const PROVIDER_ICON: Record<string, any> = {
  Gemini: Sparkles,
  DeepSeek: Brain,
};

const PROVIDER_COLOR: Record<string, string> = {
  Gemini: '#a855f7', // paars
  DeepSeek: '#2563eb', // blauw
};

// Helper: bepaal of popup boven of onder moet openen
function getPopupPosition(element: HTMLElement | null) {
  if (!element) return 'bottom';
  const rect = element.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  // 250px is ongeveer de hoogte van de popup
  if (spaceBelow < 250 && spaceAbove > spaceBelow) {
    return 'top';
  }
  return 'bottom';
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
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);

  /**
   * Handle clicking outside the dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInfoOpen(null);
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
  const handleModelSelect = (modelCode: string) => {
    onModelChange(modelCode);
    setIsOpen(false);
    setInfoOpen(null);
  };

  const selectedModelInfo = availableModels.find(m => m.code === selectedModel);
  const ProviderIcon = selectedModelInfo ? PROVIDER_ICON[selectedModelInfo.provider] : Brain;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Pill-shaped Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
          isDark 
            ? 'bg-gray-600/80 border-gray-500 text-gray-200 hover:bg-gray-600 hover:border-gray-400' 
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
        } ${isOpen ? 'ring-2' : ''}`}
        style={{ 
          fontFamily: customization.fontFamily,
          '--tw-ring-color': customization.primaryColor + '40'
        } as React.CSSProperties}
      >
        {/* Provider Icon */}
        <ProviderIcon className="w-3.5 h-3.5 opacity-80" />
        
        {/* Model Name (full) */}
        <span className="truncate">
          {selectedModelInfo?.name || selectedModel}
        </span>
        
        {/* Dropdown Arrow */}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Enhanced Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute bottom-full left-0 mb-2 min-w-72 rounded-xl border shadow-xl z-50 backdrop-blur-sm ${
            isDark 
              ? 'bg-gray-800/95 border-gray-600' 
              : 'bg-white/95 border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Kies AI Model
            </h3>
          </div>
          
          {/* Model List */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {availableModels.map((model) => {
              const isSelected = model.code === selectedModel;
              const ModelProviderIcon = PROVIDER_ICON[model.provider];
              const providerColor = PROVIDER_COLOR[model.provider];
              
              return (
                <div
                  key={model.code}
                  className={`relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-purple-50 text-purple-900'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleModelSelect(model.code)}
                  onMouseEnter={() => setHoveredModel(model.code)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  {/* Provider Icon with Color */}
                  <div 
                    className="flex-shrink-0 p-2 rounded-lg"
                    style={{ 
                      backgroundColor: isSelected ? providerColor + '20' : (isDark ? '#374151' : '#f3f4f6'),
                      color: isSelected ? providerColor : (isDark ? '#9CA3AF' : '#6B7280')
                    }}
                  >
                    <ModelProviderIcon className="w-4 h-4" />
                  </div>
                  
                  {/* Model Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{model.name}</span>
                      {(model.code === 'DeepSeek-R1' || model.code === 'gemini-2.5-pro-preview-06-05') && (
                        <span 
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: providerColor + '20',
                            color: providerColor
                          }}
                        >
                          <Brain className="w-3 h-3" />
                          Reasoning
                        </span>
                      )}
                      {isSelected && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: providerColor }}
                        >
                          Actief
                        </span>
                      )}
                    </div>
                    
                    {/* Description */}
                    {model.description && (
                      <p className={`text-xs mt-1 line-clamp-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {model.description}
                      </p>
                    )}
                    
                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.capabilities.slice(0, 4).map((cap: string) => {
                        const capInfo = (MODEL_CAPABILITIES as any)[cap];
                        if (!capInfo) return null;
                        const Icon = ICON_MAP[capInfo.icon] || FileText;
                        return (
                          <span
                            key={cap}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                              isDark 
                                ? 'bg-gray-600 text-gray-300' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                            title={capInfo.label}
                          >
                            <Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{capInfo.label}</span>
                          </span>
                        );
                      })}
                      {model.capabilities.length > 4 && (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          +{model.capabilities.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div 
                      className="absolute right-3 top-3 w-2 h-2 rounded-full"
                      style={{ backgroundColor: providerColor }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}