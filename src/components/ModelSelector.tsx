/**
 * ModelSelector Component
 * 
 * A simplified dropdown component for selecting AI models in the chat interface.
 * Clean design matching the provided reference image.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Brain, Sparkles, Feather, Star, Lock, FileText, Image as ImageIcon, Mic, Code, ListChecks, Globe, SlidersHorizontal, Database, ScanText } from 'lucide-react';
import { CustomizationSettings } from '../types/app';
import type { ModelInfo } from '../types/app';
import { MODEL_CAPABILITIES } from '../types/app';

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
  Groq: Sparkles,
  Qwen: Brain,
};

const PROVIDER_COLOR: Record<string, string> = {
  DeepSeek: '#2563eb', // blue
  Claude: '#fbbf24', // yellow/orange
  Mistral: '#ef4444', // red
  Groq: '#10b981', // emerald
  Qwen: '#8b5cf6', // violet
};

const CAPABILITY_ICON: Record<string, any> = {
  text: FileText,
  image: ImageIcon,
  audio: Mic,
  code: Code,
  structured_outputs: ListChecks,
  search: Globe,
  tuning: SlidersHorizontal,
  caching: Database,
  embedding: Database,
  ocr: ScanText,
  voice: Mic,
  agentic: Sparkles,
  reasoning: Brain,
  multimodal: ImageIcon,
  lightweight: Feather,
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
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('bellosai-favorite-models');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

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

  const toggleFavorite = (code: string) => {
    setFavorites(prev => {
      const next = prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code];
      try { localStorage.setItem('bellosai-favorite-models', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const selectedModelInfo = availableModels.find(m => m.code === selectedModel);
  const ProviderIcon = selectedModelInfo ? PROVIDER_ICON[selectedModelInfo.provider] : Brain;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isDark ? 'text-white' : 'text-gray-900'} ${isOpen ? 'ring-2 ring-opacity-50' : ''}`}
        style={{ 
          fontFamily: customization.fontFamily,
          background: customization.gradientEnabled 
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor,
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
          className={`absolute bottom-full left-0 mb-2 min-w-64 rounded-xl border shadow-lg z-50 ${
            isDark 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="py-1 max-h-96 overflow-y-auto">
            {/* Favorites section */}
            {favorites.length > 0 && (
              <div className="px-3 py-2 text-xs opacity-70">Favorites</div>
            )}
            {availableModels.filter(m => favorites.includes(m.code)).map((model) => {
              const isSelected = model.code === selectedModel;
              const ModelProviderIcon = PROVIDER_ICON[model.provider];
              const providerColor = PROVIDER_COLOR[model.provider];
              const isPremium = model.premium;
              const isUnsupported = model.capabilities.some(c => ['embedding','ocr','voice','multimodal'].includes(c)) && model.forChat === false || model.capabilities.some(c => ['embedding','ocr','voice','multimodal'].includes(c));
              const isDisabled = (isPremium && !hasActiveSubscription) || isUnsupported;
              return (
                <button
                  key={model.code}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } ${isSelected ? (isDark ? 'bg-gray-700' : 'bg-purple-50') : ''} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                  {/* Capabilities */}
                  <span className="ml-2 flex items-center gap-1">
                    {model.capabilities.slice(0, 5).map(cap => {
                      const IconComp = CAPABILITY_ICON[cap] || FileText;
                      return <IconComp key={cap} className="w-3.5 h-3.5 opacity-70" />
                    })}
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
                  {isUnsupported && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-600 text-white opacity-80">Unsupported</span>
                  )}
                  {/* Favorite toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(model.code); }}
                    className={`ml-2 text-xs px-2 py-0.5 rounded ${favorites.includes(model.code) ? 'bg-yellow-500 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
                    aria-label="Toggle favorite"
                  >★</button>
                </button>
              );
            })}

            {/* Grouped by provider */}
            {['Mistral','DeepSeek','Claude','Groq','Qwen'].map((prov) => (
              <div key={prov}>
                <div className="px-3 py-2 text-xs opacity-70">{prov}</div>
                {availableModels.filter(m => m.provider === (prov as any) && !favorites.includes(m.code)).map((model) => {
                  const isSelected = model.code === selectedModel;
                  const ModelProviderIcon = PROVIDER_ICON[model.provider];
                  const providerColor = PROVIDER_COLOR[model.provider];
                  const isPremium = model.premium;
                  const isUnsupported = model.capabilities.some(c => ['embedding','ocr','voice','multimodal'].includes(c)) && model.forChat === false || model.capabilities.some(c => ['embedding','ocr','voice','multimodal'].includes(c));
                  const isDisabled = (isPremium && !hasActiveSubscription) || isUnsupported;
                  return (
                    <button
                      key={model.code}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } ${isSelected ? (isDark ? 'bg-gray-700' : 'bg-purple-50') : ''} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={() => !isDisabled && handleModelSelect(model.code)}
                      disabled={isDisabled}
                    >
                      <ModelProviderIcon className="w-4 h-4" style={{ color: providerColor }} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{model.name}</div>
                        {model.description && (
                          <div className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{model.description}</div>
                        )}
                      </div>
                      <span className="ml-2 flex items-center gap-1">
                        {model.capabilities.slice(0, 5).map(cap => {
                          const IconComp = CAPABILITY_ICON[cap] || FileText;
                          return <IconComp key={cap} className="w-3.5 h-3.5 opacity-70" />
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(model.code); }}
                        className={`ml-2 text-xs px-2 py-0.5 rounded ${favorites.includes(model.code) ? 'bg-yellow-500 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
                        aria-label="Toggle favorite"
                      >★</button>
                      {isUnsupported && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-600 text-white opacity-80">Unsupported</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
